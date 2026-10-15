import * as net from 'net';
import { unlinkSync, existsSync } from 'fs';

import {
  type IpcRequest,
  type IpcResponse,
  type HandleMessageOptions,
  type DispatchParams,
  type PaneRollingParams,
  type PaneFailureParams,
  type PaneStatusParams,
  type PromptParams,
  type PromptResultData,
  IPC_METHODS
} from './types';
import { logger } from '../logging';
import { readPidFile } from '../bootstrap';
import { sessionExists } from '../tmux';
import { validateWorkspace } from '../cli';
import { dispatch, getPaneStatus, markPaneError, runPromptOnPane, triggerPaneRolling } from '../pipe';

let ipcServerInstance: net.Server | null = null;
let ipcSocketPath: string = '';

/**
 * 提取错误信息文本
 * @param err 捕获到的错误
 * @returns 错误消息文本
 */
const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * 关闭连接；已关闭时跳过（向已关闭的 socket 写入会触发未捕获的 error）
 * @param conn socket 连接
 */
const closeConnection = (conn: net.Socket): void => {
  if (conn.writable && !conn.destroyed) {
    conn.end();
  }
};

/**
 * 发送 IPC 响应并在 exit 请求时触发进程退出
 * @param conn socket 连接
 * @param req 原始请求
 * @param res 响应消息
 */
const sendResponse = (conn: net.Socket, req: IpcRequest, res: IpcResponse): void => {
  const pid = readPidFile();
  // 延迟响应期间客户端可能已断开，此时写入会抛未捕获的 error
  if (conn.writable && !conn.destroyed) {
    conn.end(JSON.stringify(res));
  }
  logger.trace(`[ipc-server] handle method ${req.method}, response info: ${JSON.stringify(res)}`);
  if (req.method === 'ipcServerExit') {
    setImmediate(() => {
      const sessionName = validateWorkspace();
      void sessionExists(sessionName).then(() => {
        logger.info(`⚠️ session ${sessionName} is already terminated`);
      });
      logger.info(`[ipc-server] process exited with pid: ${pid}...`);
      closeConnection(conn);
      process.exit(0);
    });
  }
};

/**
 * 解析原始请求并处理，把结果写回连接
 * @param conn socket 连接
 * @param raw 连接上收到的原始报文
 * @param options 处理选项（exit 回调、连接关闭注册）
 */
const handleRequest = (conn: net.Socket, raw: string, options: HandleMessageOptions): void => {
  try {
    const req = JSON.parse(raw) as IpcRequest;
    logger.debug(`[ipc-server] parsed request id=${req.id} method=${req.method}`);
    const result = handleMessage(req, options);
    if (result instanceof Promise) {
      void result
        .then(res => sendResponse(conn, req, res))
        .catch((err: unknown) => {
          logger.debug(`[ipc-server] failed to handle async request: ${String(err)}`);
          logger.error(`[ipc-server] error handling async request: ${String(err)}`);
          closeConnection(conn);
        });
      return;
    }
    sendResponse(conn, req, result);
  } catch (err) {
    logger.debug(`[ipc-server] failed to parse or handle request: ${String(err)}`);
    logger.error(`[ipc-server] error handling request: ${String(err)}`);
    closeConnection(conn);
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
  // 延迟响应期间客户端可能先断开，兜底记录避免进程因未捕获的 error 退出
  conn.on('error', (err: Error) => {
    logger.debug(`[ipc-server] connection error: ${String(err)}`);
  });
  conn.on('end', () => {
    logger.debug(`[ipc-server] connection received, raw data length=${data.length}`);
    const options: HandleMessageOptions = {
      onExit,
      onConnectionClose: listener => conn.on('close', listener)
    };
    handleRequest(conn, data, options);
    logger.trace('[ipc-server] info connection terminated ');
  });
};

/**
 * 处理 ipcDispatch 请求：通过 daemon 进程的 routerMap 分发指令
 * @param reqId 请求 ID
 * @param params dispatch 参数
 * @returns 包含分发结果与原因的 Promise
 */
const handleDispatch = async (reqId: string, params: DispatchParams): Promise<IpcResponse> => {
  try {
    const result = await dispatch(params.session, params.window, params.paneIndex, {
      prompt: params.prompt
    });
    return { id: reqId, success: true, data: result };
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
 * 处理 ipcPaneFailure 请求：把指定 pane 置为 error
 * @param reqId 请求 ID
 * @param params pane 坐标参数
 * @returns 成功响应
 */
const handlePaneFailure = (reqId: string, params: PaneFailureParams): IpcResponse => {
  markPaneError(params.session, params.window, params.paneIndex);
  return { id: reqId, success: true, data: {} };
};

/**
 * 处理 ipcPrompt 请求：独占 pane 执行一条 prompt 并等待 Claude Stop
 * 该响应会一直挂起到 Stop 到达或超时，客户端保持连接即视为持有独占
 * @param reqId 请求 ID
 * @param params 独占执行参数
 * @param options 处理选项（用于感知连接关闭）
 * @returns 执行结果响应
 */
const handlePrompt = async (
  reqId: string,
  params: PromptParams,
  options?: HandleMessageOptions
): Promise<IpcResponse> => {
  try {
    const outcome = await runPromptOnPane(
      params.session,
      params.window,
      params.paneIndex,
      params.prompt,
      params.timeoutMs,
      { onConnectionClose: options?.onConnectionClose }
    );
    const data: PromptResultData = { outcome };
    return { id: reqId, success: true, data };
  } catch (err) {
    const message = errorMessage(err);
    logger.error(`[ipc-server] handlePrompt error: ${message}`);
    return { id: reqId, success: false, error: message };
  }
};

/**
 * 处理 ipcPaneStatus 请求：查询指定 pane 的注册与占用状态
 * @param reqId 请求 ID
 * @param params pane 坐标参数
 * @returns 状态响应
 */
const handlePaneStatus = (reqId: string, params: PaneStatusParams): IpcResponse => {
  return { id: reqId, success: true, data: getPaneStatus(params.session, params.window, params.paneIndex) };
};

/**
 * 处理 IPC 请求
 * @param req IPC 请求消息
 * @param options 可选参数（onExit 回调、连接关闭注册等）
 * @returns IPC 响应消息；ipcDispatch 与 ipcPrompt 返回 Promise
 */
export const handleMessage = (req: IpcRequest, options?: HandleMessageOptions): IpcResponse | Promise<IpcResponse> => {
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
      case IPC_METHODS.ipcPaneFailure:
        return handlePaneFailure(req.id, req.params as PaneFailureParams);
      case IPC_METHODS.ipcPrompt:
        return handlePrompt(req.id, req.params as PromptParams, options);
      case IPC_METHODS.ipcPaneStatus:
        return handlePaneStatus(req.id, req.params as PaneStatusParams);
      default:
        logger.warn(`[ipc-server] unknown method received: ${String(req.method)}`);
        return { id: req.id, success: false, error: `Unknown method: ${String(req.method)}` };
    }
  } catch (err) {
    const message = errorMessage(err);
    return { id: req.id, success: false, error: message };
  }
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
