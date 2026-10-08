import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IPC_METHODS, type IpcMethod, type IpcRequest } from '../../src/ipc/types';

const { mockDispatch, mockTriggerPaneRolling } = vi.hoisted(() => ({
  mockDispatch: vi.fn().mockResolvedValue(true),
  mockTriggerPaneRolling: vi.fn()
}));

vi.mock('../../src/pipe/dispatcher', () => ({
  dispatch: mockDispatch,
  triggerPaneRolling: mockTriggerPaneRolling
}));

import { handleMessage } from '../../src/ipc/server';

/** 各 IPC 方法的最小合法参数（Record 类型穷举：新增方法时必须补齐，否则编译失败） */
const validParams: Record<IpcMethod, unknown> = {
  ipcServerExit: undefined,
  ipcDispatch: { session: 'test-session', window: 'myagent', paneIndex: 0, prompt: 'hello' },
  ipcPaneRolling: { session: 'test-session', window: 'myagent', paneIndex: 0 }
};

describe('IPC 契约', () => {
  it('IPC_METHODS 中每个方法都有服务端处理器', async () => {
    for (const method of Object.values(IPC_METHODS)) {
      const res = await handleMessage({ id: `contract-${method}`, method, params: validParams[method] });
      expect(res.success, `方法 ${method} 缺少服务端处理器`).toBe(true);
    }
  });
});

describe('handleMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未知方法返回 success=false 和错误信息', async () => {
    const req: IpcRequest = { id: 'req-5', method: 'unknown' as 'ipcServerExit', params: undefined };
    const res = await handleMessage(req);
    expect(res.id).toBe('req-5');
    expect(res.success).toBe(false);
    expect(res.error).toContain('unknown');
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
        prompt: 'hello world'
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ dispatched: true });
    expect(mockDispatch).toHaveBeenCalledWith('test-session', 'myagent', 0, { prompt: 'hello world' });
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
        prompt: 'hello'
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
        prompt: 'hello'
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ dispatched: false });
  });

  it('ipcPaneRolling 调用 triggerPaneRolling 并返回 success=true', async () => {
    const req: IpcRequest = {
      id: 'req-pane-rolling-1',
      method: 'ipcPaneRolling',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({});
    expect(mockTriggerPaneRolling).toHaveBeenCalledWith('test-session', 'myagent', 0);
  });
});
