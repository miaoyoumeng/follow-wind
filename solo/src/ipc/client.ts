import * as net from 'net';

import { readConfig, getIpcSocketPath } from '../config';
import { IPC_METHODS, type IpcRequest, type IpcResponse, type IpcMethod, type RegisterTaskParams } from './types';
import type { TaskStatus } from '../task';

let requestId = 0;

/**
 * 从配置读取 name 并计算 IPC socket 路径
 * @returns socket 文件绝对路径
 */
const resolveSocketPath = (): string => {
  const { name } = readConfig();
  return getIpcSocketPath(name);
};

/**
 * 通过 Unix socket 向 IPC 服务端发送请求并等待响应
 * @param method 方法名
 * @param params 参数
 * @param socketPath socket 文件路径（默认从配置计算）
 * @returns 响应 data 字段
 */
const sendRequest = (method: IpcMethod, params?: unknown, socketPath?: string): Promise<unknown> => {
  const resolvedPath = socketPath ?? resolveSocketPath();
  return new Promise((resolve, reject) => {
    const id = `req-${++requestId}`;
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
 * @param params 任务参数：type/pid 为 daemon 注册；agentName/session/window/paneIndex 为 pane 级任务
 * @param socketPath socket 路径（默认从配置计算）
 * @returns 任务 ID
 */
export const registerTask = async (params: RegisterTaskParams, socketPath?: string): Promise<string> => {
  const data = await sendRequest(IPC_METHODS.registerTask, params, socketPath);
  return (data as { taskId: string }).taskId;
};

/**
 * 获取全部任务列表（IPC 客户端）
 * @param socketPath socket 路径（默认从配置计算）
 * @returns 全部任务列表
 */
export const listTasks = async (socketPath?: string): Promise<unknown[]> => {
  const data = await sendRequest(IPC_METHODS.listTasks, undefined, socketPath);
  return (data as { tasks: unknown[] }).tasks;
};

/**
 * 通过 IPC 更新 daemon taskStorage 中的任务状态
 * worker 进程运行在独立子进程，必须通过 IPC 通知 daemon 更新状态
 * @param taskId 任务 ID
 * @param status 新状态
 * @param socketPath socket 路径（默认从配置计算）
 */
export const updateTaskState = async (taskId: string, status: TaskStatus, socketPath?: string): Promise<void> => {
  await sendRequest(IPC_METHODS.updateTaskState, { taskId, status }, socketPath);
  return undefined;
};

/**
 * 通过 IPC 协议通知 daemon 进程优雅退出
 * daemon 收到 exit 请求后，先发送响应，再通过 setImmediate 调用 process.exit(0)
 * @param socketPath socket 路径（默认从配置计算）
 */
export const exitDaemon = async (socketPath?: string): Promise<void> => {
  await sendRequest(IPC_METHODS.exit, undefined, socketPath);
  return undefined;
};
