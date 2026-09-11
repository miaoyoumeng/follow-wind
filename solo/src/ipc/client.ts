import * as net from 'net';

import { IPC_SOCKET_PATH } from '../config/paths';
import { IPC_METHODS, type IpcRequest, IpcResponse, IpcMethod } from './types';
import type { TaskStatus } from '../task';

let requestId = 0;

/**
 * 通过 Unix socket 向 IPC 服务端发送请求并等待响应
 * @param method 方法名
 * @param params 参数
 * @param socketPath socket 文件路径（默认 IPC_SOCKET_PATH）
 * @returns 响应 data 字段
 */
const sendRequest = (method: IpcMethod, params?: unknown, socketPath: string = IPC_SOCKET_PATH): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const id = `req-${++requestId}`;
    const req: IpcRequest = { id, method, params };
    const client = net.createConnection(socketPath, () => {
      client.end(JSON.stringify(req));
    });
    let data = '';
    client.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    client.on('end', () => {
      try {
        const res: IpcResponse = JSON.parse(data);
        if (res.success) {
          resolve(res.data);
        } else {
          reject(new Error(res.error ?? 'Unknown IPC error'));
        }
      } catch (err) {
        reject(err);
      }
    });
    client.on('error', reject);
  });
};

/**
 * 注册任务（IPC 客户端）
 * @param params 任务参数
 * @param socketPath socket 路径（测试用，默认 IPC_SOCKET_PATH）
 * @returns 任务 ID
 */
export const registerTask = async (
  params: {
    type: 'local_bash' | 'local_agent' | 'dream';
    pid?: number;
  },
  socketPath?: string
): Promise<string> => {
  const data = await sendRequest(IPC_METHODS.registerTask, params, socketPath);
  return (data as { taskId: string }).taskId;
};

/**
 * 获取运行中的任务（IPC 客户端）
 * @param socketPath socket 路径（测试用，默认 IPC_SOCKET_PATH）
 * @returns 运行中的任务列表
 */
export const getRunningTasks = async (socketPath?: string): Promise<unknown[]> => {
  const data = await sendRequest(IPC_METHODS.getRunningTasks, undefined, socketPath);
  return (data as { tasks: unknown[] }).tasks;
};

/**
 * 获取各状态任务统计（IPC 客户端）
 * @param socketPath socket 路径（测试用，默认 IPC_SOCKET_PATH）
 * @returns 各状态计数
 */
export const statTask = async (socketPath?: string): Promise<unknown> => {
  const data = await sendRequest(IPC_METHODS.statTask, undefined, socketPath);
  return (data as { stat: unknown }).stat;
};

/**
 * 通过 IPC 更新 daemon taskStorage 中的任务状态
 * worker 进程运行在独立子进程，必须通过 IPC 通知 daemon 更新状态
 * @param taskId 任务 ID
 * @param status 新状态
 * @param socketPath socket 路径（测试用，默认 IPC_SOCKET_PATH）
 */
export const updateTaskState = async (
  taskId: string,
  status: TaskStatus,
  socketPath: string = IPC_SOCKET_PATH
): Promise<void> => {
  await sendRequest(IPC_METHODS.updateTaskState, { taskId, status }, socketPath);
  return undefined;
};

/**
 * 通过 IPC 协议通知 daemon 进程优雅退出
 * daemon 收到 exit 请求后，先发送响应，再通过 setImmediate 调用 process.exit(0)
 * @param socketPath socket 路径（测试用，默认 IPC_SOCKET_PATH）
 */
export const exitDaemon = async (socketPath: string = IPC_SOCKET_PATH): Promise<void> => {
  await sendRequest(IPC_METHODS.exit, undefined, socketPath);
  return undefined;
};
