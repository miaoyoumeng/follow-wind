import * as net from 'net';
import { unlinkSync, existsSync } from 'fs';

import {
  type IpcRequest,
  type IpcResponse,
  type HandleExitOptions,
  type RegisterTaskParams,
  type DispatchParams,
  type PaneStableParams,
  IPC_METHODS
} from './types';
import { registerTask, listTasks, updateTaskState, getTerminalCounts } from '../task';
import { logger } from '../logging';
import { readPidFile } from '../bootstrap';
import { sessionExists } from '../tmux';
import { validateWorkspace } from '../cli';
import { dispatch, notifyStable } from '../pipe';

let ipcServerInstance: net.Server | null = null;
let ipcSocketPath: string = '';

/**
 * debug 级别日志快捷方法：仅在 debug 启用时输出
 * @param message 日志消息
 */
const debugIpc = (message: string): void => {
  logger.debug(`[ipc-server] ${message}`);
};

/**
 * 发送 IPC 响应并在 exit 请求时触发进程退出
 * @param conn socket 连接
 * @param req 原始请求
 * @param res 响应消息
 */
const sendResponse = (conn: net.Socket, req: IpcRequest, res: IpcResponse): void => {
  const pid = readPidFile();
  conn.end(JSON.stringify(res));
  logger.trace(`[ipc-server] handle method ${req.method},  request info: ${JSON.stringify(res)}`);
  if (req.method === 'ipcServerExit') {
    setImmediate(() => {
      const sessionName = validateWorkspace();
      void sessionExists(sessionName).then(() => {
        logger.info(`⚠️ session ${sessionName} is already terminated`);
      });
      logger.info(`[ipc-server] process exited with pid: ${pid}...`);
      conn.end();
      process.exit(0);
    });
  }
};

/**
 * 处理单个 IPC 连接的请求和响应
 * @param conn socket 连接
 * @param onExit exit 方法被调用时的回调
 */
const handleConnection = (conn: net.Socket, onExit: () => void): void => {
  let data = '';
  conn.on('data', (chunk: Buffer) => {
    data += chunk.toString();
  });
  conn.on('end', () => {
    debugIpc(`connection received, raw data length=${data.length}`);
    try {
      const req = JSON.parse(data) as IpcRequest;
      debugIpc(`parsed request id=${req.id} method=${req.method}`);
      const result = handleMessage(req, { onExit });
      if (result instanceof Promise) {
        void result
          .then(res => sendResponse(conn, req, res))
          .catch(err => {
            debugIpc(`failed to handle async request: ${String(err)}`);
            logger.error(`[ipc-server] error handling async request: ${String(err)}`);
            conn.end();
          });
      } else {
        sendResponse(conn, req, result);
      }
    } catch (err) {
      debugIpc(`failed to parse or handle request: ${String(err)}`);
      logger.error(`[ipc-server] error handling request: ${String(err)}`);
      conn.end();
    } finally {
      logger.trace('[ipc-server] info connection terminated ');
    }
  });
};

/**
 * 启动 IPC Unix socket 服务端，接收请求并委托 handleMessage 处理
 * @param socketPath socket 文件路径（如 .solo/ipc-[name].sock）
 * @param onExit exit 方法被调用时的回调（用于触发 daemon 优雅关闭）
 * @param onListening socket 开始监听后的回调
 */
export const startIpcServer = (socketPath: string, onExit: () => void, onListening?: () => void): void => {
  if (ipcServerInstance !== null) {
    return;
  }
  ipcSocketPath = socketPath;
  logger.info('[ipc-server] starting...');
  if (existsSync(socketPath)) {
    unlinkSync(socketPath);
  }

  const server = net.createServer({ allowHalfOpen: true }, conn => handleConnection(conn, onExit));
  server.on('error', err => {
    logger.error(`[ipc-server] error: ${String(err)}`);
  });
  server.listen(socketPath, () => {
    ipcServerInstance = server;
    logger.info(`[ipc-server] listening on ${socketPath}`);
    onListening?.();
  });
};

/**
 * 停止 IPC 服务端并清理 socket 文件
 */
export const stopIpcServer = (): void => {
  if (ipcServerInstance !== null) {
    logger.info('[ipc-server] stopping...');
    ipcServerInstance.close();
    ipcServerInstance = null;
    if (ipcSocketPath && existsSync(ipcSocketPath)) {
      unlinkSync(ipcSocketPath);
    }
    ipcSocketPath = '';
    logger.info('[ipc-server] stopped');
  }
};

/**
 * 处理 ipcDispatch 请求：通过 daemon 进程的 routerMap 分发指令
 * @param reqId 请求 ID
 * @param params dispatch 参数
 * @returns 包含 dispatched 状态的 Promise
 */
const handleDispatch = async (reqId: string, params: DispatchParams): Promise<IpcResponse> => {
  try {
    const dispatched = await dispatch(params.session, params.window, params.paneIndex, {
      command: params.command
    });
    return { id: reqId, success: true, data: { dispatched } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[ipc-server] handleDispatch error: ${message}`);
    return { id: reqId, success: false, error: message };
  }
};

/**
 * 处理 ipcPaneStable 请求：通知指定 pane 的 router 已稳定
 * @param reqId 请求 ID
 * @param params pane 稳定参数
 * @returns 成功响应
 */
const handlePaneStable = (reqId: string, params: PaneStableParams): IpcResponse => {
  notifyStable(params.session, params.window, params.paneIndex);
  return { id: reqId, success: true, data: {} };
};

/**
 * 处理 IPC 请求，委托 chatTaskStorage 执行
 * @param req IPC 请求消息
 * @param options 可选参数（onExit 回调等）
 * @returns IPC 响应消息；ipcDispatch 返回 Promise
 */
export const handleMessage = (req: IpcRequest, options?: HandleExitOptions): IpcResponse | Promise<IpcResponse> => {
  try {
    switch (req.method) {
      case IPC_METHODS.ipcRegisterTask: {
        logger.info('[ipc] registerTask method received, register a task...');
        const taskId = registerTask(req.params as RegisterTaskParams);
        return { id: req.id, success: true, data: { taskId } };
      }
      case IPC_METHODS.ipcListTasks: {
        debugIpc('ipcListTasks received');
        const tasks = listTasks();
        const terminalCounts = getTerminalCounts();
        return { id: req.id, success: true, data: { tasks, terminalCounts } };
      }
      case IPC_METHODS.ipcUpdateTaskState: {
        const { taskId, status } = req.params as { taskId: string; status: Parameters<typeof updateTaskState>[1] };
        debugIpc(`ipcUpdateTaskState received taskId=${taskId} status=${status}`);
        updateTaskState(taskId, status);
        return { id: req.id, success: true, data: {} };
      }
      case IPC_METHODS.ipcServerExit: {
        logger.info('[ipc] exit method received, triggering daemon shutdown');
        options?.onExit?.();
        return { id: req.id, success: true, data: {} };
      }
      case IPC_METHODS.ipcDispatch:
        return handleDispatch(req.id, req.params as DispatchParams);
      case IPC_METHODS.ipcPaneStable:
        return handlePaneStable(req.id, req.params as PaneStableParams);
      default:
        logger.warn(`[ipc-server] unknown method received: ${String(req.method)}`);
        return { id: req.id, success: false, error: `Unknown method: ${String(req.method)}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: req.id, success: false, error: message };
  }
};
