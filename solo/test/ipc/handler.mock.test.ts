import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IpcRequest } from '../../src/ipc/types';

const {
  mockRegisterTask,
  mockListTasks,
  mockUpdateTaskState,
  mockGetTerminalCounts,
  mockGetTask,
  mockDispatch,
  mockNotifyStable
} = vi.hoisted(() => ({
  mockRegisterTask: vi.fn().mockReturnValue('task-001'),
  mockListTasks: vi.fn().mockReturnValue([]),
  mockUpdateTaskState: vi.fn(),
  mockGetTerminalCounts: vi.fn().mockReturnValue({ completed: 0, timeout: 0, failed: 0, killed: 0 }),
  mockGetTask: vi.fn().mockReturnValue({ id: 'task-001', type: 'tmux', status: 'running', createdAt: '' }),
  mockDispatch: vi.fn().mockResolvedValue(true),
  mockNotifyStable: vi.fn()
}));

vi.mock('../../src/task/chatTaskStorage', () => ({
  registerTask: mockRegisterTask,
  listTasks: mockListTasks,
  updateTaskState: mockUpdateTaskState,
  getTerminalCounts: mockGetTerminalCounts,
  getTask: mockGetTask
}));

vi.mock('../../src/pipe/dispatcher', () => ({
  dispatch: mockDispatch,
  notifyStable: mockNotifyStable
}));

import { handleMessage } from '../../src/ipc/server';

describe('handleMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('处理 registerTask 请求，委托 chatTaskStorage.registerTask', async () => {
    const req: IpcRequest = {
      id: 'req-1',
      method: 'ipcRegisterTask',
      params: { type: 'tmux' }
    };
    const res = await handleMessage(req);
    expect(res.id).toBe('req-1');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ taskId: 'task-001' });
    expect(mockRegisterTask).toHaveBeenCalledWith({ type: 'tmux' });
  });

  it('处理 listTasks 请求，委托 chatTaskStorage.listTasks', async () => {
    const tasks = [
      { id: 'task-1', status: 'running', type: 'tmux', session: 's', window: 'w', paneIndex: 0, createdAt: '' }
    ];
    mockListTasks.mockReturnValue(tasks);
    const req: IpcRequest = { id: 'req-3', method: 'ipcListTasks' };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      tasks,
      terminalCounts: { completed: 0, timeout: 0, failed: 0, killed: 0 }
    });
    expect(mockListTasks).toHaveBeenCalled();
  });

  it('处理 updateTaskState 请求，委托 chatTaskStorage.updateTaskState', async () => {
    const req: IpcRequest = {
      id: 'req-update-1',
      method: 'ipcUpdateTaskState',
      params: { taskId: 'task-001', status: 'running' }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(mockUpdateTaskState).toHaveBeenCalledWith('task-001', 'running');
  });

  it('未知方法返回 success=false 和错误信息', async () => {
    const req: IpcRequest = { id: 'req-5', method: 'unknown' as 'ipcServerExit', params: undefined };
    const res = await handleMessage(req);
    expect(res.id).toBe('req-5');
    expect(res.success).toBe(false);
    expect(res.error).toContain('unknown');
  });

  it('chatTaskStorage 抛出异常时返回 success=false 和错误信息', async () => {
    mockRegisterTask.mockImplementationOnce(() => {
      throw new Error('register failed');
    });
    const req: IpcRequest = {
      id: 'req-6',
      method: 'ipcRegisterTask',
      params: { type: 'tmux' }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(false);
    expect(res.error).toBe('register failed');
  });

  it('exit 方法调用 onExit 回调并返回 success=true', async () => {
    const mockOnExit = vi.fn();
    const req: IpcRequest = { id: 'req-7', method: 'ipcServerExit' };
    const res = await handleMessage(req, { onExit: mockOnExit });
    expect(res.id).toBe('req-7');
    expect(res.success).toBe(true);
    expect(mockOnExit).toHaveBeenCalled();
  });

  it('exit 方法未提供 onExit 回调时仍返回 success=true', async () => {
    const req: IpcRequest = { id: 'req-8', method: 'ipcServerExit' };
    const res = await handleMessage(req);
    expect(res.id).toBe('req-8');
    expect(res.success).toBe(true);
  });

  it('ipcDispatch 调用 dispatch 并返回 dispatched=true', async () => {
    mockDispatch.mockResolvedValueOnce(true);
    const req: IpcRequest = {
      id: 'req-dispatch-1',
      method: 'ipcDispatch',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0,
        command: 'hello world'
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ dispatched: true });
    expect(mockDispatch).toHaveBeenCalledWith('test-session', 'myagent', 0, { command: 'hello world' });
  });

  it('ipcDispatch 中 dispatch 抛出异常时返回 success=false 和错误信息', async () => {
    mockDispatch.mockRejectedValueOnce(new Error('dispatch boom'));
    const req: IpcRequest = {
      id: 'req-dispatch-err',
      method: 'ipcDispatch',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0,
        command: 'hello'
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(false);
    expect(res.error).toBe('dispatch boom');
  });

  it('ipcDispatch 中 dispatch 返回 false 时返回 dispatched=false', async () => {
    mockDispatch.mockResolvedValueOnce(false);
    const req: IpcRequest = {
      id: 'req-dispatch-2',
      method: 'ipcDispatch',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0,
        command: 'hello'
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ dispatched: false });
  });

  it('ipcPaneStable 调用 notifyStable 并返回 success=true', async () => {
    const req: IpcRequest = {
      id: 'req-pane-stable-1',
      method: 'ipcPaneStable',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({});
    expect(mockNotifyStable).toHaveBeenCalledWith('test-session', 'myagent', 0);
  });
});
