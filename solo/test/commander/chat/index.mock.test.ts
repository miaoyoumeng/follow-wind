import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockValidateWorkspace,
  mockGetAgent,
  mockListPanesWithTitle,
  mockSelectPane,
  mockSendKeysEnter,
  mockWaitForIdle
} = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockGetAgent: vi.fn(),
  mockListPanesWithTitle: vi.fn(),
  mockSelectPane: vi.fn().mockResolvedValue(undefined),
  mockSendKeysEnter: vi.fn().mockResolvedValue(undefined),
  mockWaitForIdle: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../src/commander/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

vi.mock('../../../src/agents', () => ({
  getAgent: mockGetAgent
}));

vi.mock('../../../src/tmux', () => ({
  listPanesWithTitle: mockListPanesWithTitle,
  selectPane: mockSelectPane,
  sendKeysEnter: mockSendKeysEnter
}));

vi.mock('../../../src/commander/chat/wait', () => ({
  waitForIdle: mockWaitForIdle
}));

import { runChat } from '../../../src/commander/chat';

describe('runChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateWorkspace.mockReturnValue('test-session');
  });

  describe('agent 不存在', () => {
    it('getAgent 返回 undefined 时，打印友好提示并返回', async () => {
      mockGetAgent.mockReturnValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('nonexistent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('agent "nonexistent" 不存在'));
      expect(mockSelectPane).not.toHaveBeenCalled();
      expect(mockSendKeysEnter).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('agent 无 claude pane', () => {
    it('agent 未配置 panes 时，打印友好提示并返回', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: false,
        panes: undefined
      });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('agent "myagent" 没有 claude pane'));
      expect(mockSelectPane).not.toHaveBeenCalled();
      expect(mockSendKeysEnter).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('agent 的 panes 中无 claude tag 时，打印友好提示并返回', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: false,
        panes: {
          left: { layout: 'left' },
          right: { layout: 'right' }
        }
      });
      mockListPanesWithTitle.mockResolvedValue([
        { index: 0, title: 'left' },
        { index: 1, title: 'right' }
      ]);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('agent "myagent" 没有 claude pane'));
      expect(mockSelectPane).not.toHaveBeenCalled();
      expect(mockSendKeysEnter).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('正常流程', () => {
    it('找到 claude pane 后，先 selectPane 再 sendKeysEnter', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: false,
        panes: {
          left: { layout: 'left' },
          claude: { layout: 'right' }
        }
      });
      mockListPanesWithTitle.mockResolvedValue([
        { index: 0, title: 'left' },
        { index: 1, title: 'claude' }
      ]);

      await runChat('myagent', 'hello world');

      expect(mockValidateWorkspace).toHaveBeenCalled();
      expect(mockGetAgent).toHaveBeenCalledWith('myagent');
      expect(mockListPanesWithTitle).toHaveBeenCalledWith('test-session', 'myagent');
      expect(mockSelectPane).toHaveBeenCalledWith('test-session', 'myagent', 1);
      expect(mockSendKeysEnter).toHaveBeenCalledWith('test-session', 'myagent', 1, 'hello world');
    });

    it('sendKeysEnter 一次调用：内容 + Enter', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: true,
        panes: {
          claude: { layout: 'left' }
        }
      });
      mockListPanesWithTitle.mockResolvedValue([
        { index: 0, title: 'claude' }
      ]);

      await runChat('myagent', 'test message');

      expect(mockSendKeysEnter).toHaveBeenCalledTimes(1);
      expect(mockSendKeysEnter).toHaveBeenCalledWith('test-session', 'myagent', 0, 'test message');
    });
  });
});
