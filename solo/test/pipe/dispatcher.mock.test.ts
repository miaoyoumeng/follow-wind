import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TmuxRouter } from '../../src/pipe/router';
import { InstructQueue } from '../../src/pipe/queue';

const { mockPaneRolling } = vi.hoisted(() => ({
  mockPaneRolling: vi.fn()
}));

vi.mock('../../src/pipe/router', () => ({
  TmuxRouter: function (...args: unknown[]): TmuxRouter {
    return mockPaneRolling(...args) as TmuxRouter;
  }
}));

vi.mock('../../src/logging', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

import { dispatch, registerRouter, clearAll, notifyStable } from '../../src/pipe/dispatcher';

const mockRouter = (): TmuxRouter => {
  const queue = new InstructQueue();
  return {
    session: 's',
    window: 'w',
    paneIndex: 0,
    isStable: true,
    queue,
    enqueue: (instruct: Parameters<TmuxRouter['enqueue']>[0]) => queue.enqueue(instruct),
    paneRolling: vi.fn().mockResolvedValue(undefined),
    markStable: vi.fn()
  } as unknown as TmuxRouter;
};

describe('dispatcher', () => {
  beforeEach(() => {
    clearAll();
    mockPaneRolling.mockReset();
    mockPaneRolling.mockImplementation(() => mockRouter());
  });

  describe('dispatch', () => {
    it('将指令加入 router 的 queue，返回 true', async () => {
      const router = registerRouter('s', 'w', 0);
      const result = await dispatch('s', 'w', 0, { command: 'ls' });
      expect(result).toBe(true);
      expect(router.queue.size()).toBe(1);
      expect(router.queue.peek()?.command).toBe('ls');
    });

    it('触发 router 的 roller', async () => {
      const router = registerRouter('s', 'w', 0);
      await dispatch('s', 'w', 0, { command: 'ls' });
      expect(router.paneRolling).toHaveBeenCalled();
    });

    it('未注册 router 时返回 false', async () => {
      const result = await dispatch('s', 'w', 0, { command: 'ls' });
      expect(result).toBe(false);
      expect(mockPaneRolling).not.toHaveBeenCalled();
    });
  });

  describe('registerRouter', () => {
    it('调用 paneRolling 创建并存储 router', () => {
      const router = registerRouter('s', 'w', 0);
      expect(mockPaneRolling).toHaveBeenCalledWith();
      expect(router).toBeDefined();
    });

    it('相同 pane 返回同一 router 实例（不重复创建）', () => {
      const r1 = registerRouter('s', 'w', 0);
      const r2 = registerRouter('s', 'w', 0);
      expect(r1).toBe(r2);
      expect(mockPaneRolling).toHaveBeenCalledTimes(1);
    });

    it('不同 pane 创建不同的 router', () => {
      registerRouter('s', 'w', 0);
      registerRouter('s', 'w', 1);
      expect(mockPaneRolling).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearAll', () => {
    it('清理后重新注册会创建新 router', () => {
      registerRouter('s', 'w', 0);
      clearAll();
      registerRouter('s', 'w', 0);
      expect(mockPaneRolling).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifyStable', () => {
    it('调用 router 的 markStable 方法', () => {
      const router = registerRouter('s', 'w', 0);
      notifyStable('s', 'w', 0);
      expect(router.markStable).toHaveBeenCalled();
    });

    it('调用 router 的 paneRolling 方法', () => {
      const router = registerRouter('s', 'w', 0);
      notifyStable('s', 'w', 0);
      expect(router.paneRolling).toHaveBeenCalled();
    });

    it('未注册 router 时不报错', () => {
      expect(() => notifyStable('s', 'w', 0)).not.toThrow();
    });
  });
});
