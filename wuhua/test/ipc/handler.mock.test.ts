import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IPC_METHODS, type IpcMethod, type IpcRequest } from '../../src/ipc/types';

const { mockDispatch, mockTriggerPaneRolling, mockMarkPaneError, mockGetPaneStatus, mockRunPromptOnPane } = vi.hoisted(
  () => ({
    mockDispatch: vi.fn().mockResolvedValue({ dispatched: true }),
    mockTriggerPaneRolling: vi.fn(),
    mockMarkPaneError: vi.fn().mockReturnValue(true),
    mockGetPaneStatus: vi.fn().mockReturnValue({ session: 's', window: 'w', paneIndex: 0, status: 'idle' }),
    mockRunPromptOnPane: vi.fn().mockResolvedValue('completed')
  })
);

vi.mock('../../src/pipe/dispatcher', () => ({
  dispatch: mockDispatch,
  triggerPaneRolling: mockTriggerPaneRolling,
  markPaneError: mockMarkPaneError,
  getPaneStatus: mockGetPaneStatus
}));

vi.mock('../../src/pipe/promptRun', () => ({
  runPromptOnPane: mockRunPromptOnPane
}));

import { handleMessage } from '../../src/ipc/server';

/** 各 IPC 方法的最小合法参数（Record 类型穷举：新增方法时必须补齐，否则编译失败） */
const validParams: Record<IpcMethod, unknown> = {
  ipcServerExit: undefined,
  ipcDispatch: { session: 'test-session', window: 'myagent', paneIndex: 0, prompt: 'hello' },
  ipcPaneRolling: { session: 'test-session', window: 'myagent', paneIndex: 0 },
  ipcPaneFailure: { session: 'test-session', window: 'myagent', paneIndex: 0 },
  ipcPrompt: { session: 'test-session', window: 'myagent', paneIndex: 0, prompt: 'hello', timeoutMs: 60000 },
  ipcPaneStatus: { session: 'test-session', window: 'myagent', paneIndex: 0 }
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
    mockDispatch.mockResolvedValueOnce({ dispatched: true });
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

  it('ipcDispatch 中 dispatch 未分发时，透传原因', async () => {
    mockDispatch.mockResolvedValueOnce({ dispatched: false, reason: 'busy' });
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
    expect(res.data).toEqual({ dispatched: false, reason: 'busy' });
  });

  it('ipcPrompt 委托 runPromptOnPane，并把 outcome 放入 data', async () => {
    mockRunPromptOnPane.mockResolvedValueOnce('timeout');
    const req: IpcRequest = {
      id: 'req-prompt-1',
      method: 'ipcPrompt',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 1,
        prompt: 'do something',
        timeoutMs: 30000
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ outcome: 'timeout' });
    expect(mockRunPromptOnPane).toHaveBeenCalledWith(
      'test-session',
      'myagent',
      1,
      'do something',
      30000,
      expect.anything()
    );
  });

  it('ipcPrompt 中 runPromptOnPane 抛异常时返回 success=false 和错误信息', async () => {
    mockRunPromptOnPane.mockRejectedValueOnce(new Error('prompt boom'));
    const req: IpcRequest = {
      id: 'req-prompt-err',
      method: 'ipcPrompt',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0,
        prompt: 'hello',
        timeoutMs: 1000
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(false);
    expect(res.error).toBe('prompt boom');
  });

  it('ipcPaneStatus 返回该 pane 的状态', async () => {
    mockGetPaneStatus.mockReturnValueOnce({
      session: 'test-session',
      window: 'myagent',
      paneIndex: 0,
      status: 'running'
    });
    const req: IpcRequest = {
      id: 'req-status-1',
      method: 'ipcPaneStatus',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ session: 'test-session', window: 'myagent', paneIndex: 0, status: 'running' });
    expect(mockGetPaneStatus).toHaveBeenCalledWith('test-session', 'myagent', 0);
  });

  it('ipcPaneStatus 未注册 router 时透传 null', async () => {
    mockGetPaneStatus.mockReturnValueOnce(null);
    const req: IpcRequest = {
      id: 'req-status-2',
      method: 'ipcPaneStatus',
      params: { session: 'test-session', window: 'myagent', paneIndex: 0 }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toBeNull();
  });

  it('ipcPaneFailure 调用 markPaneError 并返回 success=true', async () => {
    const req: IpcRequest = {
      id: 'req-pane-failure-1',
      method: 'ipcPaneFailure',
      params: {
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0
      }
    };
    const res = await handleMessage(req);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({});
    expect(mockMarkPaneError).toHaveBeenCalledWith('test-session', 'myagent', 0);
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
