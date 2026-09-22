import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runHook } from '../../src/commander/hook';
import type * as TmuxType from '../../src/tmux';

// vi.hoisted: 共享 mock 引用
const { mockReadConfig, mockCapturePane, mockDetectIntervention } = vi.hoisted(() => ({
  mockReadConfig: vi.fn(),
  mockCapturePane: vi.fn(),
  mockDetectIntervention: vi.fn()
}));

vi.mock('../../src/config', () => ({
  readConfig: mockReadConfig
}));

vi.mock('../../src/tmux', async () => {
  const actual = await vi.importActual<typeof TmuxType>('../../src/tmux');
  return { ...actual, capturePane: mockCapturePane };
});

vi.mock('../../src/claude', () => ({
  detectIntervention: mockDetectIntervention
}));

describe('runHook', () => {
  beforeEach(() => {
    mockReadConfig.mockReset();
    mockCapturePane.mockReset();
    mockDetectIntervention.mockReset();
  });

  describe('name 校验', () => {
    it('name 不在 tmux hook 池中时，抛出错误', async () => {
      await expect(runHook({ name: 'not-a-hook', sessionName: 's', windowName: 'w', paneIndex: '0' })).rejects.toThrow(
        '未知 hook 事件'
      );
    });
  });

  describe('session 名称校验', () => {
    it('session 名称不匹配时直接返回 null', async () => {
      mockReadConfig.mockReturnValue({ name: 'my-project' });
      const result = await runHook({
        name: 'after-select-pane',
        sessionName: 'other-project',
        windowName: 'agent1',
        paneIndex: '0'
      });
      expect(result).toBeNull();
      expect(mockCapturePane).not.toHaveBeenCalled();
      expect(mockDetectIntervention).not.toHaveBeenCalled();
    });
  });

  describe('session 匹配后执行策略判断', () => {
    const validParams = {
      name: 'after-select-pane',
      sessionName: 'my-project',
      windowName: 'agent1',
      paneIndex: '2'
    };

    beforeEach(() => {
      mockReadConfig.mockReturnValue({ name: 'my-project' });
      mockCapturePane.mockResolvedValue('你觉得该怎么做？');
    });

    it('session 匹配 → 调用 capturePane 读取 pane 内容', async () => {
      mockDetectIntervention.mockReturnValue(null);
      await runHook(validParams);
      expect(mockCapturePane).toHaveBeenCalledWith('my-project', 'agent1', 2);
    });

    it('策略匹配时返回策略名称', async () => {
      mockDetectIntervention.mockReturnValue('structuredQuestion');
      const result = await runHook(validParams);
      expect(result).toBe('structuredQuestion');
    });

    it('无策略匹配时返回 null', async () => {
      mockDetectIntervention.mockReturnValue(null);
      const result = await runHook(validParams);
      expect(result).toBeNull();
    });

    it('pane 内容传递给 detectIntervention', async () => {
      mockCapturePane.mockResolvedValue('pane content here');
      mockDetectIntervention.mockReturnValue(null);
      await runHook(validParams);
      expect(mockDetectIntervention).toHaveBeenCalledWith({ content: 'pane content here' });
    });
  });
});
