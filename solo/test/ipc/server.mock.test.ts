import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IpcRequest } from '../../src/ipc/types';

const { mockRegisterTask, mockGetRunningTasks, mockStatTask, mockUpdateTaskState } = vi.hoisted(() => ({
  mockRegisterTask: vi.fn().mockReturnValue('task-001'),
  mockGetRunningTasks: vi.fn().mockReturnValue([]),
  mockStatTask: vi.fn().mockReturnValue({ pending: 0, running: 0, completed: 0, timeout: 0, failed: 0, killed: 0 }),
  mockUpdateTaskState: vi.fn()
}));

vi.mock('../../src/task/taskStorage', () => ({
  registerTask: mockRegisterTask,
  getRunningTasks: mockGetRunningTasks,
  statTask: mockStatTask,
  updateTaskState: mockUpdateTaskState
}));

import { handleMessage } from '../../src/ipc/server';

describe('handleMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('处理 registerTask 请求，委托 taskStorage.registerTask', () => {
    const req: IpcRequest = {
      id: 'req-1',
      method: 'registerTask',
      params: { type: 'local_bash' }
    };
    const res = handleMessage(req);
    expect(res.id).toBe('req-1');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ taskId: 'task-001' });
    expect(mockRegisterTask).toHaveBeenCalledWith({ type: 'local_bash' });
  });

  it('处理 registerTask 请求（带 pid 参数）', () => {
    const req: IpcRequest = {
      id: 'req-2',
      method: 'registerTask',
      params: { type: 'local_agent', pid: 12345 }
    };
    const res = handleMessage(req);
    expect(res.success).toBe(true);
    expect(mockRegisterTask).toHaveBeenCalledWith({ type: 'local_agent', pid: 12345 });
  });

  it('处理 getRunningTasks 请求，委托 taskStorage.getRunningTasks', () => {
    const tasks = [
      { id: 'task-1', status: 'running', type: 'local_bash', session: 's', window: 'w', paneIndex: 0, createdAt: '' }
    ];
    mockGetRunningTasks.mockReturnValue(tasks);
    const req: IpcRequest = { id: 'req-3', method: 'getRunningTasks' };
    const res = handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ tasks });
    expect(mockGetRunningTasks).toHaveBeenCalled();
  });

  it('处理 statTask 请求，委托 taskStorage.statTask', () => {
    const stat = { pending: 1, running: 2, completed: 3, timeout: 0, failed: 0, killed: 0 };
    mockStatTask.mockReturnValue(stat);
    const req: IpcRequest = { id: 'req-4', method: 'statTask' };
    const res = handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ stat });
    expect(mockStatTask).toHaveBeenCalled();
  });

  it('处理 updateTaskState 请求，委托 taskStorage.updateTaskState', () => {
    const req: IpcRequest = {
      id: 'req-update-1',
      method: 'updateTaskState',
      params: { taskId: 'task-001', status: 'running' }
    };
    const res = handleMessage(req);
    expect(res.success).toBe(true);
    expect(mockUpdateTaskState).toHaveBeenCalledWith('task-001', 'running');
  });

  it('未知方法返回 success=false 和错误信息', () => {
    const req: IpcRequest = { id: 'req-5', method: 'unknown' as 'exit', params: undefined };
    const res = handleMessage(req);
    expect(res.id).toBe('req-5');
    expect(res.success).toBe(false);
    expect(res.error).toContain('unknown');
  });

  it('taskStorage 抛出异常时返回 success=false 和错误信息', () => {
    mockRegisterTask.mockImplementationOnce(() => {
      throw new Error('register failed');
    });
    const req: IpcRequest = {
      id: 'req-6',
      method: 'registerTask',
      params: { type: 'local_bash' }
    };
    const res = handleMessage(req);
    expect(res.success).toBe(false);
    expect(res.error).toBe('register failed');
  });

  it('exit 方法调用 onExit 回调并返回 success=true', () => {
    const mockOnExit = vi.fn();
    const req: IpcRequest = { id: 'req-7', method: 'exit' };
    const res = handleMessage(req, { onExit: mockOnExit });
    expect(res.id).toBe('req-7');
    expect(res.success).toBe(true);
    expect(mockOnExit).toHaveBeenCalled();
  });

  it('exit 方法未提供 onExit 回调时仍返回 success=true', () => {
    const req: IpcRequest = { id: 'req-8', method: 'exit' };
    const res = handleMessage(req);
    expect(res.id).toBe('req-8');
    expect(res.success).toBe(true);
  });
});
