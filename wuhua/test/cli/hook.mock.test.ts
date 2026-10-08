import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runHook } from '../../src/cli/hook';
import type * as TmuxType from '../../src/tmux';

// vi.hoisted: 共享 mock 引用
const {
  mockReadConfig,
  mockReadStdin,
  mockIsTmuxRunning,
  mockGetSessionName,
  mockGetWindowName,
  mockGetPaneIndex,
  mockGetPaneName
} = vi.hoisted(() => ({
  mockReadConfig: vi.fn(),
  mockReadStdin: vi.fn(),
  mockIsTmuxRunning: vi.fn(),
  mockGetSessionName: vi.fn(),
  mockGetWindowName: vi.fn(),
  mockGetPaneIndex: vi.fn(),
  mockGetPaneName: vi.fn()
}));

vi.mock('../../src/config', () => ({
  readConfig: mockReadConfig
}));

vi.mock('../../src/tmux', async () => {
  const actual = await vi.importActual<typeof TmuxType>('../../src/tmux');
  return {
    ...actual,
    isTmuxRunning: mockIsTmuxRunning,
    getSessionName: mockGetSessionName,
    getWindowName: mockGetWindowName,
    getPaneIndex: mockGetPaneIndex,
    getPaneName: mockGetPaneName
  };
});

vi.mock('../../src/utils/files', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readStdin: mockReadStdin
}));

describe('runHook', () => {
  beforeEach(() => {
    mockReadConfig.mockReset();
    mockReadStdin.mockReset();
    mockReadStdin.mockResolvedValue('{}');
    mockIsTmuxRunning.mockReset();
    mockIsTmuxRunning.mockResolvedValue(true);
    mockGetSessionName.mockReset();
    mockGetWindowName.mockReset();
    mockGetPaneIndex.mockReset();
    mockGetPaneName.mockReset();
    mockGetSessionName.mockResolvedValue('mock-session');
    mockGetWindowName.mockResolvedValue('mock-window');
    mockGetPaneIndex.mockResolvedValue(0);
    mockGetPaneName.mockResolvedValue('mock-pane');
  });

  describe('返回值', () => {
    it('runHook 返回 undefined（void）', async () => {
      const result = await runHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      expect(result).toBeUndefined();
    });
  });

  describe('endpoint 校验', () => {
    it('endpoint 不是 tmux 或 claude 时，返回 undefined', async () => {
      const result = await runHook({
        endpoint: 'invalid' as 'tmux',
        event: 'after-select-pane'
      });
      expect(result).toBeUndefined();
    });
  });

  describe('event 校验', () => {
    it('endpoint=tmux 且 event 不在 tmux hook 池中时，抛出错误', async () => {
      await expect(runHook({ endpoint: 'tmux', event: 'not-a-hook' })).rejects.toThrow('未知 hook 事件');
    });
  });

  describe('session 名称校验', () => {
    it('display-message 返回的 session 与配置不匹配时返回 undefined', async () => {
      mockReadConfig.mockReturnValue({ name: 'my-project' });
      mockGetSessionName.mockResolvedValue('other-project');
      const result = await runHook({
        endpoint: 'tmux',
        event: 'after-select-pane'
      });
      expect(result).toBeUndefined();
    });
  });

  describe('endpoint=claude 处理', () => {
    it('endpoint=claude 时返回 undefined（暂不实现）', async () => {
      const result = await runHook({
        endpoint: 'claude',
        event: 'some-event'
      });
      expect(result).toBeUndefined();
    });

    it('endpoint=claude 时 workspace 可选透传', async () => {
      const result = await runHook({
        endpoint: 'claude',
        event: 'some-event',
        workspace: '/tmp'
      });
      expect(result).toBeUndefined();
    });
  });
});
