import * as net from 'net';
import { unlinkSync, existsSync } from 'fs';

import {
  type IpcRequest,
  type IpcResponse,
  type HandleExitOptions,
  type DispatchParams,
  type PaneRollingParams,
  IPC_METHODS
} from './types';
import { logger } from '../logging';
import { readPidFile } from '../bootstrap';
import { sessionExists } from '../tmux';
import { validateWorkspace } from '../cli';
import { dispatch, triggerPaneRolling } from '../pipe';

let ipcServerInstance: net.Server | null = null;
let ipcSocketPath: string = '';

/**
 * 提取错误信息文本
 * @param err 捕获到的错误
 * @returns 错误消息文本
 */
const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * 发送 IPC 响应并在 exit 请求时触发进程退出
 * @param conn socket 连接
 * @param req 原始请求
 * @param res 响应消息
 */
const sendResponse = (conn: net.Socket, req: IpcRequest, res: IpcResponse): void => {
  const pid = readPidFile();
  conn.end(JSON.stringify(res));
  logger.trace(`[ipc-server] handle method ${req.method}, response info: ${JSON.stringify(res)}`);
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
    logger.debug(`[ipc-server] connection received, raw data length=${data.length}`);
    try {
      const req = JSON.parse(data) as IpcRequest;
      logger.debug(`[ipc-server] parsed request id=${req.id} method=${req.method}`);
      const result = handleMessage(req, { onExit });
      if (result instanceof Promise) {
        void result
          .then(res => sendResponse(conn, req, res))
          .catch(err => {
            logger.debug(`[ipc-server] failed to handle async request: ${String(err)}`);
            logger.error(`[ipc-server] error handling async request: ${String(err)}`);
            conn.end();
          });
      } else {
        sendResponse(conn, req, result);
      }
    } catch (err) {
      logger.debug(`[ipc-server] failed to parse or handle request: ${String(err)}`);
      logger.error(`[ipc-server] error handling request: ${String(err)}`);
      conn.end();
    } finally {
      logger.trace('[ipc-server] info connection terminated ');
    }
  });
};

/**
 * 启动 IPC Unix socket 服务端，接收请求并委托 handleMessage 处理
 * @param socketPath socket 文件路径（如 .wuhua/ipc-[name].sock）
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
      prompt: params.prompt
    });
    return { id: reqId, success: true, data: { dispatched } };
  } catch (err) {
    const message = errorMessage(err);
    logger.error(`[ipc-server] handleDispatch error: ${message}`);
    return { id: reqId, success: false, error: message };
  }
};

/**
 * 处理 ipcPaneRolling 请求：触发指定 pane 的 router 执行下一次 paneRolling
 * @param reqId 请求 ID
 * @param params pane rolling 参数
 * @returns 成功响应
 */
const handlePaneRolling = (reqId: string, params: PaneRollingParams): IpcResponse => {
  triggerPaneRolling(params.session, params.window, params.paneIndex);
  return { id: reqId, success: true, data: {} };
};

/**
 * 处理 IPC 请求
 * @param req IPC 请求消息
 * @param options 可选参数（onExit 回调等）
 * @returns IPC 响应消息；ipcDispatch 返回 Promise
 */
export const handleMessage = (req: IpcRequest, options?: HandleExitOptions): IpcResponse | Promise<IpcResponse> => {
  try {
    switch (req.method) {
      case IPC_METHODS.ipcServerExit: {
        logger.info('[ipc] exit method received, triggering daemon shutdown');
        options?.onExit?.();
        return { id: req.id, success: true, data: {} };
      }
      case IPC_METHODS.ipcDispatch:
        return handleDispatch(req.id, req.params as DispatchParams);
      case IPC_METHODS.ipcPaneRolling:
        return handlePaneRolling(req.id, req.params as PaneRollingParams);
      default:
        logger.warn(`[ipc-server] unknown method received: ${String(req.method)}`);
        return { id: req.id, success: false, error: `Unknown method: ${String(req.method)}` };
    }
  } catch (err) {
    const message = errorMessage(err);
    return { id: req.id, success: false, error: message };
  }
};
