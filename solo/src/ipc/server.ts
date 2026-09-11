import { type IpcRequest, type IpcResponse, type HandleMessageOptions, IPC_METHODS } from './types';
import { registerTask, getRunningTasks, statTask, updateTaskState } from '../task';
import { info } from '../logging';

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
        const params = req.params as { type: 'local_bash' | 'local_agent' | 'dream'; pid?: number };
        const taskId = registerTask(params);
        return { id: req.id, success: true, data: { taskId } };
      }
      case IPC_METHODS.getRunningTasks: {
        const tasks = getRunningTasks();
        return { id: req.id, success: true, data: { tasks } };
      }
      case IPC_METHODS.statTask: {
        const stat = statTask();
        return { id: req.id, success: true, data: { stat } };
      }
      case IPC_METHODS.updateTaskState: {
        const { taskId, status } = req.params as { taskId: string; status: Parameters<typeof updateTaskState>[1] };
        updateTaskState(taskId, status);
        return { id: req.id, success: true, data: {} };
      }
      case IPC_METHODS.exit: {
        info('[ipc] exit method received, triggering daemon shutdown');
        options?.onExit?.();
        return { id: req.id, success: true, data: {} };
      }
      default:
        return { id: req.id, success: false, error: `Unknown method: ${req.method}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: req.id, success: false, error: message };
  }
};
