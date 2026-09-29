import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadConfig, mockGetSessionName, mockGetWindowName, mockGetPaneIndex, mockGetPaneName } = vi.hoisted(() => ({
  mockReadConfig: vi.fn(),
  mockGetSessionName: vi.fn(),
  mockGetWindowName: vi.fn(),
  mockGetPaneIndex: vi.fn(),
  mockGetPaneName: vi.fn()
}));

vi.mock('../../src/config', () => ({
  readConfig: mockReadConfig
}));

vi.mock('../../src/tmux', () => ({
  getSessionName: mockGetSessionName,
  getWindowName: mockGetWindowName,
  getPaneIndex: mockGetPaneIndex,
  getPaneName: mockGetPaneName
}));

import { createTmuxHook } from '../../src/hooks/tmuxHook';

describe('createTmuxHook', () => {
  beforeEach(() => {
    mockReadConfig.mockReset();
    mockGetSessionName.mockReset();
    mockGetWindowName.mockReset();
    mockGetPaneIndex.mockReset();
    mockGetPaneName.mockReset();
  });

  describe('字段构造', () => {
    it('name 对应 event 参数', () => {
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      expect(hook.name).toBe('after-select-pane');
    });

    it('type 为 tmux', () => {
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      expect(hook.type).toBe('tmux');
    });

    it('time 为 ISO 字符串', () => {
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      expect(hook.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('runner 为函数', () => {
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      expect(typeof hook.runner).toBe('function');
    });

    it('构造时 sessionName/windowName/paneIndex 初始为空字符串', () => {
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      expect(hook.sessionName).toBe('');
      expect(hook.windowName).toBe('');
      expect(hook.paneIndex).toBe('');
    });
  });

  describe('runner() 成功路径', () => {
    beforeEach(() => {
      mockReadConfig.mockReturnValue({ name: 'my-project' });
      mockGetSessionName.mockResolvedValue('my-project');
      mockGetWindowName.mockResolvedValue('agent1');
      mockGetPaneIndex.mockResolvedValue(2);
      mockGetPaneName.mockResolvedValue('pane-title');
    });

    it('runner 调用 getSessionName/getWindowName/getPaneIndex/getPaneName 获取当前 tmux 信息', async () => {
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      await hook.runner();
      expect(mockGetSessionName).toHaveBeenCalled();
      expect(mockGetWindowName).toHaveBeenCalled();
      expect(mockGetPaneIndex).toHaveBeenCalled();
      expect(mockGetPaneName).toHaveBeenCalled();
    });

    it('runner() 执行后 sessionName/windowName/paneIndex 被 display-message 值填充', async () => {
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      await hook.runner();
      expect(hook.sessionName).toBe('my-project');
      expect(hook.windowName).toBe('agent1');
      expect(hook.paneIndex).toBe('2');
    });
  });

  describe('runner() session 不匹配', () => {
    it('display-message 返回的 session 与配置不匹配时直接返回', async () => {
      mockReadConfig.mockReturnValue({ name: 'my-project' });
      mockGetSessionName.mockResolvedValue('other-project');
      mockGetWindowName.mockResolvedValue('agent1');
      mockGetPaneIndex.mockResolvedValue(0);
      mockGetPaneName.mockResolvedValue('pane-title');
      const hook = createTmuxHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      await hook.runner();
      expect(hook.sessionName).toBe('');
    });
  });
});
