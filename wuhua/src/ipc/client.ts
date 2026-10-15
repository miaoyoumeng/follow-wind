import * as net from 'net';

import { readConfig, getIpcSocketPath } from '../config';
import { IPC_METHODS, type IpcRequest, type IpcResponse, type IpcMethod, type PromptResultData } from './types';
import type { DispatchResult, PaneStatus, PromptRunOutcome } from '../pipe';
import { logger } from '../logging';

let requestId = 0;

/**
 * 从配置读取 name 并计算 IPC socket 路径
 * @returns socket 文件绝对路径
 */
const resolveSocketPath = (): string => {
  const { name } = readConfig();
  const socketPath = getIpcSocketPath(name);
  logger.debug(`[ipc-client] resolved socket path: ${socketPath}`);
  return socketPath;
};

/**
 * 通过 Unix socket 向 IPC 服务端发送请求并等待响应
 * @param method 方法名
 * @param params 参数
 * @param socketPath socket 文件路径（默认从配置计算）
 * @returns 响应 data 字段，类型由调用方通过类型参数 T 指定
 */
const sendIpcRequest = <T = unknown>(method: IpcMethod, params?: unknown, socketPath?: string): Promise<T> => {
  const resolvedPath = socketPath ?? resolveSocketPath();
  return new Promise((resolve, reject) => {
    const id = `req-${++requestId}`;
    logger.debug(`[ipc-client] sending ${method} (${id}) to ${resolvedPath}`);
    const req: IpcRequest = { id, method, params };
    const client = net.createConnection(resolvedPath, () => {
      client.end(JSON.stringify(req));
    });
    let data = '';
    client.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    client.on('end', () => {
      try {
        const res = JSON.parse(data) as IpcResponse;
        if (res.success) {
          logger.debug(`[ipc-client] ${id} success`);
          resolve(res.data as T);
        } else {
          const err = res.error ?? 'Unknown IPC error';
          logger.debug(`[ipc-client] ${id} failed: ${err}`);
          reject(new Error(err));
        }
      } catch (err) {
        logger.debug(`[ipc-client] ${id} parse error: ${String(err)}`);
        reject(err);
      }
    });
    client.on('error', err => {
      logger.debug(`[ipc-client] ${id} connection error: ${String(err)}`);
      reject(err);
    });
  });
};

/**
 * 通过 IPC 将指令分发到 daemon 进程中已注册的 router
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param prompt 要执行的内容
 * @param socketPath socket 路径（默认从配置计算）
 * @returns true 表示指令已入队并触发 roller；false 表示未注册 router
 */
export const ipcDispatch = async (
  session: string,
  window: string,
  paneIndex: number,
  prompt: string,
  socketPath?: string
): Promise<DispatchResult> => {
  const data = await sendIpcRequest<DispatchResult>(
    IPC_METHODS.ipcDispatch,
    { session, window, paneIndex, prompt },
    socketPath
  );
  logger.info(`[ipc-client] ipcDispatch completed, dispatched=${data.dispatched}, reason=${data.reason ?? ''}`);
  return data;
};

/**
 * 通过 IPC 让 daemon 独占 pane 执行一条 prompt，并等待 Claude Stop
 * 该请求会一直挂起到 Stop 到达或超时，期间不返回
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param prompt 要执行的 prompt 内容
 * @param timeoutMs 等待 Stop 的超时毫秒数
 * @param socketPath socket 路径（默认从配置计算）
 * @returns 独占执行结果
 */
export const ipcPrompt = async (
  session: string,
  window: string,
  paneIndex: number,
  prompt: string,
  timeoutMs: number,
  socketPath?: string
): Promise<PromptRunOutcome> => {
  const data = await sendIpcRequest<PromptResultData>(
    IPC_METHODS.ipcPrompt,
    { session, window, paneIndex, prompt, timeoutMs },
    socketPath
  );
  logger.info(`[ipc-client] ipcPrompt completed, outcome=${data.outcome}`);
  return data.outcome;
};

/**
 * 通过 IPC 查询指定 pane 的状态
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param socketPath socket 路径（默认从配置计算）
 * @returns 该 pane 的状态；未注册 router 时为 null
 */
export const ipcPaneStatus = async (
  session: string,
  window: string,
  paneIndex: number,
  socketPath?: string
): Promise<PaneStatus | null> => {
  const data = await sendIpcRequest<PaneStatus | null>(
    IPC_METHODS.ipcPaneStatus,
    { session, window, paneIndex },
    socketPath
  );
  logger.debug(`[ipc-client] ipcPaneStatus completed, status=${data?.status ?? 'unregistered'}`);
  return data;
};

/**
 * 通过 IPC 协议通知 daemon 进程优雅退出
 * daemon 收到 exit 请求后，先发送响应，再通过 setImmediate 调用 process.exit(0)
 * @param socketPath socket 路径（默认从配置计算）
 */
export const exitDaemon = async (socketPath?: string): Promise<void> => {
  logger.info('[ipc-client] exitDaemon requested');
  await sendIpcRequest(IPC_METHODS.ipcServerExit, undefined, socketPath);
};

/**
 * 通知 daemon 触发指定 pane 的下一次 paneRolling（由 Stop hook 调用）
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param socketPath socket 路径（默认从配置计算）
 */
export const ipcPaneRolling = async (
  session: string,
  window: string,
  paneIndex: number,
  socketPath?: string
): Promise<void> => {
  await sendIpcRequest(IPC_METHODS.ipcPaneRolling, { session, window, paneIndex }, socketPath);
  logger.debug(`[ipc-client] ipcPaneRolling requested, pane=${session}:${window}.${paneIndex}`);
};

/**
 * 通知 daemon 把指定 pane 置为 error（由 StopFailure hook 调用）
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param socketPath socket 路径（默认从配置计算）
 */
export const ipcPaneFailure = async (
  session: string,
  window: string,
  paneIndex: number,
  socketPath?: string
): Promise<void> => {
  await sendIpcRequest(IPC_METHODS.ipcPaneFailure, { session, window, paneIndex }, socketPath);
  logger.debug(`[ipc-client] ipcPaneFailure requested, pane=${session}:${window}.${paneIndex}`);
};
