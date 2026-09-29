import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCapturePane, mockWriteFile, mockGetTmuxPaneCapturePath, mockIpcPaneStable } = vi.hoisted(() => ({
  mockCapturePane: vi.fn(),
  mockWriteFile: vi.fn(),
  mockGetTmuxPaneCapturePath: vi.fn(),
  mockIpcPaneStable: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../src/tmux', () => ({
  capturePane: mockCapturePane
}));

vi.mock('../../../src/utils/files', () => ({
  writeFile: mockWriteFile
}));

vi.mock('../../../src/config', () => ({
  getTmuxPaneCapturePath: mockGetTmuxPaneCapturePath
}));

vi.mock('../../../src/ipc/client', () => ({
  ipcPaneStable: mockIpcPaneStable
}));

vi.mock('../../../src/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn()
  }
}));

import { createProcessor } from '../../../src/hooks/event/factory';
import { isClaudeHookEvent } from '../../../src/hooks/event/types';
import type { ProcessorContext } from '../../../src/hooks/event/types';

describe('createProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseContext: ProcessorContext = {
    stdinData: {},
    workspace: ''
  };

  describe('SessionStart', () => {
    it('返回 SessionStart processor', async () => {
      const processor = createProcessor('SessionStart');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });

  describe('SessionEnd', () => {
    it('返回 SessionEnd processor', async () => {
      const processor = createProcessor('SessionEnd');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });

  describe('Stop', () => {
    it('返回 Stop processor', async () => {
      const processor = createProcessor('Stop');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
    });

    it('Stop processor 在 tmux 上下文完整时调用 capturePane', async () => {
      mockCapturePane.mockResolvedValue('pane content');
      mockGetTmuxPaneCapturePath.mockReturnValue('/tmp/capture/my-session-agent1-0.md');

      const context: ProcessorContext = {
        session: 'my-session',
        window: 'agent1',
        paneIndex: 0,
        stdinData: { hook_event_name: 'Stop' },
        workspace: ''
      };

      const processor = createProcessor('Stop');
      await processor.process(context);

      expect(mockCapturePane).toHaveBeenCalledWith('my-session', 'agent1', 0);
      expect(mockGetTmuxPaneCapturePath).toHaveBeenCalledWith('agent1', 0);
      expect(mockWriteFile).toHaveBeenCalledWith('/tmp/capture/my-session-agent1-0.md', 'pane content');
    });

    it('Stop processor 在 tmux 上下文不完整时不调用 capturePane', async () => {
      const context: ProcessorContext = {
        stdinData: { hook_event_name: 'Stop' },
        workspace: ''
      };

      const processor = createProcessor('Stop');
      await processor.process(context);

      expect(mockCapturePane).not.toHaveBeenCalled();
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('Stop processor 在 tmux 上下文完整时调用 ipcPaneStable', async () => {
      mockCapturePane.mockResolvedValue('pane content');
      mockGetTmuxPaneCapturePath.mockReturnValue('/tmp/capture/my-session-agent1-0.md');

      const context: ProcessorContext = {
        session: 'my-session',
        window: 'agent1',
        paneIndex: 0,
        stdinData: { hook_event_name: 'Stop' },
        workspace: ''
      };

      const processor = createProcessor('Stop');
      await processor.process(context);

      expect(mockIpcPaneStable).toHaveBeenCalledWith('my-session', 'agent1', 0);
    });

    it('Stop processor 在 tmux 上下文不完整时不调用 ipcPaneStable', async () => {
      const context: ProcessorContext = {
        stdinData: { hook_event_name: 'Stop' },
        workspace: ''
      };

      const processor = createProcessor('Stop');
      await processor.process(context);

      expect(mockIpcPaneStable).not.toHaveBeenCalled();
    });
  });

  describe('StopFailure', () => {
    it('返回 StopFailure processor', async () => {
      const processor = createProcessor('StopFailure');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });

  describe('PreToolUse', () => {
    it('返回 PreToolUse processor', async () => {
      const processor = createProcessor('PreToolUse');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });

  describe('PostToolUse', () => {
    it('返回 PostToolUse processor', async () => {
      const processor = createProcessor('PostToolUse');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });

  describe('PostToolUseFailure', () => {
    it('返回 PostToolUseFailure processor', async () => {
      const processor = createProcessor('PostToolUseFailure');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });

  describe('PermissionRequest', () => {
    it('返回 PermissionRequest processor', async () => {
      const processor = createProcessor('PermissionRequest');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });

  describe('PermissionDenied', () => {
    it('返回 PermissionDenied processor', async () => {
      const processor = createProcessor('PermissionDenied');
      expect(processor).toBeDefined();
      expect(typeof processor.process).toBe('function');
      await expect(processor.process(baseContext)).resolves.not.toThrow();
    });
  });
});

describe('isClaudeHookEvent', () => {
  it.each([
    'SessionStart',
    'SessionEnd',
    'Stop',
    'StopFailure',
    'PreToolUse',
    'PostToolUse',
    'PostToolUseFailure',
    'PermissionRequest',
    'PermissionDenied'
  ])('%s 是合法的 ClaudeHookEvent', event => {
    expect(isClaudeHookEvent(event)).toBe(true);
  });

  it('未知事件返回 false', () => {
    expect(isClaudeHookEvent('UnknownEvent')).toBe(false);
  });

  it('空字符串返回 false', () => {
    expect(isClaudeHookEvent('')).toBe(false);
  });
});
