import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as TmuxType from '../../src/tmux';

const {
  mockReadStdin,
  mockIsTmuxRunning,
  mockGetSessionName,
  mockGetWindowName,
  mockGetPaneIndex,
  mockGetPaneName,
  mockCapturePane,
  mockWriteFile,
  mockGetTmuxPaneCapturePath
} = vi.hoisted(() => ({
  mockReadStdin: vi.fn(),
  mockIsTmuxRunning: vi.fn(),
  mockGetSessionName: vi.fn(),
  mockGetWindowName: vi.fn(),
  mockGetPaneIndex: vi.fn(),
  mockGetPaneName: vi.fn(),
  mockCapturePane: vi.fn(),
  mockWriteFile: vi.fn(),
  mockGetTmuxPaneCapturePath: vi.fn()
}));

vi.mock('../../src/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn()
  }
}));

vi.mock('../../src/utils/files', () => ({
  readFile: vi.fn(),
  readStdin: mockReadStdin,
  writeFile: mockWriteFile
}));

vi.mock('../../src/tmux', async () => {
  const actual = await vi.importActual<typeof TmuxType>('../../src/tmux');
  return {
    ...actual,
    isTmuxRunning: mockIsTmuxRunning,
    getSessionName: mockGetSessionName,
    getWindowName: mockGetWindowName,
    getPaneIndex: mockGetPaneIndex,
    getPaneName: mockGetPaneName,
    capturePane: mockCapturePane
  };
});

vi.mock('../../src/config', () => ({
  getTmuxPaneCapturePath: mockGetTmuxPaneCapturePath
}));

import { createClaudeHook } from '../../src/hooks/claudeHook';
import { logger } from '../../src/logging';
import { capturePane } from '../../src/tmux';
import { writeFile } from '../../src/utils/files';
import { getTmuxPaneCapturePath } from '../../src/config';

describe('createClaudeHook', () => {
  beforeEach(() => {
    mockReadStdin.mockReset();
    mockIsTmuxRunning.mockReset();
    mockGetSessionName.mockReset();
    mockGetWindowName.mockReset();
    mockGetPaneIndex.mockReset();
    mockGetPaneName.mockReset();
    mockCapturePane.mockReset();
    mockWriteFile.mockReset();
    mockGetTmuxPaneCapturePath.mockReset();
    vi.mocked(logger.debug).mockClear();
    vi.mocked(logger.info).mockClear();
  });

  describe('字段构造', () => {
    it('name 对应 event 参数', () => {
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      expect(hook.name).toBe('some-event');
    });

    it('type 为 claude', () => {
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      expect(hook.type).toBe('claude');
    });

    it('time 为 ISO 字符串', () => {
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      expect(hook.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('保留 workspace 字段', () => {
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event',
        workspace: '/tmp/workspace'
      });
      expect(hook.workspace).toBe('/tmp/workspace');
    });

    it('workspace 未提供时为空字符串', () => {
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      expect(hook.workspace).toBe('');
    });

    it('runner 为函数', () => {
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      expect(typeof hook.runner).toBe('function');
    });
  });

  describe('runner()', () => {
    beforeEach(() => {
      mockReadStdin.mockResolvedValue('{}');
      mockIsTmuxRunning.mockResolvedValue(true);
      mockGetSessionName.mockResolvedValue('my-session');
      mockGetWindowName.mockResolvedValue('agent1');
      mockGetPaneIndex.mockResolvedValue(0);
      mockGetPaneName.mockResolvedValue('pane-title');
    });

    it('读取 stdin 并解析 tool_name（不含 tool_input）', async () => {
      mockReadStdin.mockResolvedValue(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } }));
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      await hook.runner();
      expect(mockReadStdin).toHaveBeenCalled();
    });

    it('tmux 运行时调用 getSessionName/getWindowName/getPaneIndex/getPaneName 获取当前 tmux 信息', async () => {
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      await hook.runner();
      expect(mockGetSessionName).toHaveBeenCalled();
      expect(mockGetWindowName).toHaveBeenCalled();
      expect(mockGetPaneIndex).toHaveBeenCalled();
      expect(mockGetPaneName).toHaveBeenCalled();
    });

    it('tmux 未运行时不调用 display-message 相关函数', async () => {
      mockIsTmuxRunning.mockResolvedValue(false);
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      await hook.runner();
      expect(mockGetSessionName).not.toHaveBeenCalled();
      expect(mockGetWindowName).not.toHaveBeenCalled();
      expect(mockGetPaneIndex).not.toHaveBeenCalled();
      expect(mockGetPaneName).not.toHaveBeenCalled();
    });

    it('tmux 未运行时仍然读取 stdin', async () => {
      mockIsTmuxRunning.mockResolvedValue(false);
      mockReadStdin.mockResolvedValue(JSON.stringify({ tool_name: 'Read' }));
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      await hook.runner();
      expect(mockReadStdin).toHaveBeenCalled();
    });

    it('hook_event_name 为 Stop 且 tmux 运行时，调用 capturePane 截屏并写入文件', async () => {
      mockReadStdin.mockResolvedValue(JSON.stringify({ hook_event_name: 'Stop' }));
      mockCapturePane.mockResolvedValue('pane content');
      mockGetTmuxPaneCapturePath.mockReturnValue('/tmp/capture/my-session-agent1-0.md');
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      await hook.runner();
      expect(mockCapturePane).toHaveBeenCalledWith('my-session', 'agent1', 0);
      expect(mockGetTmuxPaneCapturePath).toHaveBeenCalledWith('agent1', 0);
      expect(mockWriteFile).toHaveBeenCalledWith('/tmp/capture/my-session-agent1-0.md', 'pane content');
    });

    it('hook_event_name 为 Stop 但 tmux 未运行时，不调用 capturePane', async () => {
      mockIsTmuxRunning.mockResolvedValue(false);
      mockReadStdin.mockResolvedValue(JSON.stringify({ hook_event_name: 'Stop' }));
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      await hook.runner();
      expect(mockCapturePane).not.toHaveBeenCalled();
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('hook_event_name 非 Stop 时，不调用 capturePane', async () => {
      mockReadStdin.mockResolvedValue(JSON.stringify({ hook_event_name: 'Start' }));
      const hook = createClaudeHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      await hook.runner();
      expect(mockCapturePane).not.toHaveBeenCalled();
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });
});
