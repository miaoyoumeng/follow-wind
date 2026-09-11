import { describe, it, expect } from 'vitest';
import { IPC_METHODS, type IpcRequest, type IpcResponse } from '../../src/ipc';

describe('ipc/types', () => {
  it('IPC_METHODS 包含 registerTask、getRunningTasks、statTask、updateTaskState、exit 五种方法', () => {
    expect(IPC_METHODS.registerTask).toBe('registerTask');
    expect(IPC_METHODS.getRunningTasks).toBe('getRunningTasks');
    expect(IPC_METHODS.statTask).toBe('statTask');
    expect(IPC_METHODS.updateTaskState).toBe('updateTaskState');
    expect(IPC_METHODS.exit).toBe('exit');
  });

  it('IPC_METHODS 仅有五个方法', () => {
    expect(Object.keys(IPC_METHODS)).toHaveLength(5);
  });

  it('IpcRequest 类型编译正确', () => {
    const req: IpcRequest = {
      id: 'req-1',
      method: 'registerTask',
      params: { type: 'local_bash' }
    };
    expect(req.method).toBe('registerTask');
  });

  it('IpcResponse 类型编译正确', () => {
    const res: IpcResponse = {
      id: 'req-1',
      success: true,
      data: { taskId: 'task-1' }
    };
    expect(res.success).toBe(true);
  });
});
