import * as net from 'net';

import { readConfig, getIpcSocketPath } from '../config';
import { IPC_METHODS, type IpcRequest, type IpcResponse, type IpcMethod, type RegisterTaskParams } from './types';
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
 * @returns 响应 data 字段
 */
const sendIpcRequest = (method: IpcMethod, params?: unknown, socketPath?: string): Promise<unknown> => {
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
          resolve(res.data);
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
 * 注册任务（IPC 客户端）
 * @param params 任务参数：type 为 daemon 注册；agentName/session/window/paneIndex 为 pane 级任务
 * @param socketPath socket 路径（默认从配置计算）
 * @returns 任务 ID
 */
export const ipcRegisterTask = async (params: RegisterTaskParams, socketPath?: string): Promise<string> => {
  const data = await sendIpcRequest(IPC_METHODS.ipcRegisterTask, params, socketPath);
  const taskId = (data as { taskId: string }).taskId;
  logger.info(`[ipc-client] registerTask completed, taskId=${taskId}`);
  return taskId;
};

/**
 * 通过 IPC 将指令分发到 daemon 进程中已注册的 router
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param command 要执行的命令
 * @param socketPath socket 路径（默认从配置计算）
 * @returns true 表示指令已入队并触发 roller；false 表示未注册 router
 */
export const ipcDispatch = async (
  session: string,
  window: string,
  paneIndex: number,
  command: string,
  socketPath?: string
): Promise<boolean> => {
  const data = await sendIpcRequest(IPC_METHODS.ipcDispatch, { session, window, paneIndex, command }, socketPath);
  const dispatched = (data as { dispatched: boolean }).dispatched;
  logger.info(`[ipc-client] ipcDispatch completed, dispatched=${dispatched}`);
  return dispatched;
};

/**
 * 获取全部任务列表和终态计数（IPC 客户端）
 * @param socketPath socket 路径（默认从配置计算）
 * @returns 活跃任务列表和终态计数
 */
export const ipcListTasks = async (
  socketPath?: string
): Promise<{
  tasks: unknown[];
  terminalCounts: { completed: number; timeout: number; failed: number; killed: number };
}> => {
  const data = await sendIpcRequest(IPC_METHODS.ipcListTasks, undefined, socketPath);
  const { tasks, terminalCounts } = data as {
    tasks: unknown[];
    terminalCounts: { completed: number; timeout: number; failed: number; killed: number };
  };
  logger.info(
    `[ipc-client] listTasks completed, active=${tasks.length}, completed=${terminalCounts.completed}, timeout=${terminalCounts.timeout}, failed=${terminalCounts.failed}`
  );
  return { tasks, terminalCounts };
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
 * 通知 daemon 指定 pane 已稳定（由 Stop hook 调用）
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param socketPath socket 路径（默认从配置计算）
 */
export const ipcPaneStable = async (
  session: string,
  window: string,
  paneIndex: number,
  socketPath?: string
): Promise<void> => {
  await sendIpcRequest(IPC_METHODS.ipcPaneStable, { session, window, paneIndex }, socketPath);
  logger.info(`[ipc-client] ipcPaneStable completed, pane=${session}:${window}.${paneIndex}`);
};
