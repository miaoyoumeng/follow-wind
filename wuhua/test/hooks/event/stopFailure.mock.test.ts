import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIpcPaneFailure } = vi.hoisted(() => ({
  mockIpcPaneFailure: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../src/ipc/client', () => ({
  ipcPaneFailure: mockIpcPaneFailure
}));

vi.mock('../../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

import { createStopFailureProcessor } from '../../../src/hooks/event/stopFailure';

describe('StopFailure 事件处理器', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('处理 StopFailure 事件时，通知 daemon 把该 pane 置为 error', async () => {
    const processor = createStopFailureProcessor();
    await processor.process({
      session: 'test-session',
      window: 'test-window',
      paneIndex: 0,
      stdinData: {},
      workspace: ''
    });

    expect(mockIpcPaneFailure).toHaveBeenCalledWith('test-session', 'test-window', 0);
  });

  it('tmux 上下文不完整时，不上报 pane 状态', async () => {
    const processor = createStopFailureProcessor();
    await processor.process({
      session: undefined,
      window: undefined,
      paneIndex: undefined,
      stdinData: {},
      workspace: ''
    });

    expect(mockIpcPaneFailure).not.toHaveBeenCalled();
  });

  it('IPC 上报失败时只记日志，不向外抛出', async () => {
    mockIpcPaneFailure.mockRejectedValueOnce(new Error('socket closed'));
    const processor = createStopFailureProcessor();

    await expect(
      processor.process({ session: 's', window: 'w', paneIndex: 0, stdinData: {}, workspace: '' })
    ).resolves.toBeUndefined();
  });
});
