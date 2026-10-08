import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIpcPaneRolling, mockCapturePane, mockWriteFile } = vi.hoisted(() => ({
  mockIpcPaneRolling: vi.fn().mockResolvedValue(undefined),
  mockCapturePane: vi.fn().mockResolvedValue('pane content'),
  mockWriteFile: vi.fn()
}));

vi.mock('../../../src/ipc/client', () => ({
  ipcPaneRolling: mockIpcPaneRolling
}));

vi.mock('../../../src/tmux', () => ({
  capturePane: mockCapturePane
}));

vi.mock('../../../src/utils/files', () => ({
  writeFile: mockWriteFile
}));

vi.mock('../../../src/config', () => ({
  getTmuxPaneCapturePath: vi.fn().mockReturnValue('/tmp/capture.txt')
}));

vi.mock('../../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

import { createStopProcessor } from '../../../src/hooks/event/stop';

describe('Stop 事件处理器', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('处理 Stop 事件时，截屏并触发 paneRolling', async () => {
    const processor = createStopProcessor();
    await processor.process({
      session: 'test-session',
      window: 'test-window',
      paneIndex: 0,
      stdinData: {},
      workspace: ''
    });

    // 截屏
    expect(mockCapturePane).toHaveBeenCalledWith('test-session', 'test-window', 0);
    expect(mockWriteFile).toHaveBeenCalledWith('/tmp/capture.txt', 'pane content');
    // 触发 paneRolling
    expect(mockIpcPaneRolling).toHaveBeenCalledWith('test-session', 'test-window', 0);
  });

  it('tmux 上下文不完整时，不触发截屏和 paneRolling', async () => {
    const processor = createStopProcessor();
    await processor.process({
      session: undefined,
      window: undefined,
      paneIndex: undefined,
      stdinData: {},
      workspace: ''
    });

    expect(mockCapturePane).not.toHaveBeenCalled();
    expect(mockIpcPaneRolling).not.toHaveBeenCalled();
  });
});
