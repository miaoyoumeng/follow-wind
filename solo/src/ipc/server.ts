import {
  type IpcRequest,
  type IpcResponse,
  type HandleMessageOptions,
  type RegisterTaskParams,
  IPC_METHODS
} from './types';
import { registerTask, listTasks, updateTaskState } from '../task';

import { logger } from '../logging';

/**
 * 处理 IPC 请求，委托 taskStorage 执行
 * @param req IPC 请求消息
 * @param options 可选参数（onExit 回调等）
 * @returns IPC 响应消息
 */
export const handleMessage = (req: IpcRequest, options?: HandleMessageOptions): IpcResponse => {
  try {
    switch (req.method) {
      case IPC_METHODS.registerTask: {
        logger.info('[ipc] registerTask method received, register a task...');
        const taskId = registerTask(req.params as RegisterTaskParams);
        return { id: req.id, success: true, data: { taskId } };
      }
      case IPC_METHODS.listTasks: {
        const tasks = listTasks();
        return { id: req.id, success: true, data: { tasks } };
      }
      case IPC_METHODS.updateTaskState: {
        const { taskId, status } = req.params as { taskId: string; status: Parameters<typeof updateTaskState>[1] };
        updateTaskState(taskId, status);
        return { id: req.id, success: true, data: {} };
      }
      case IPC_METHODS.exit: {
        logger.info('[ipc] exit method received, triggering daemon shutdown');
        options?.onExit?.();
        return { id: req.id, success: true, data: {} };
      }
      default:
        return { id: req.id, success: false, error: `Unknown method: ${String(req.method)}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: req.id, success: false, error: message };
  }
};
