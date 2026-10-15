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

import { dispatch, getPaneStatus, markPaneError, triggerPaneRolling } from '../../src/pipe/dispatcher';
import { registerRouter, clearAll } from '../../src/task/chatTaskStorage';

const mockRouter = (): TmuxRouter => {
  const queue = new InstructQueue();
  return {
    paneStatus: { session: 's', window: 'w', paneIndex: 0, status: 'idle' },
    queue,
    enqueue: (instruct: Parameters<TmuxRouter['enqueue']>[0]) => queue.enqueue(instruct),
    paneRolling: vi.fn().mockResolvedValue(undefined)
  } as unknown as TmuxRouter;
};

describe('dispatcher', () => {
  beforeEach(() => {
    clearAll();
    mockPaneRolling.mockReset();
    mockPaneRolling.mockImplementation(() => mockRouter());
  });

  describe('dispatch', () => {
    it('将指令加入 router 的 queue，返回 dispatched=true', async () => {
      const router = registerRouter('s', 'w', 0);
      const result = await dispatch('s', 'w', 0, { prompt: 'ls' });
      expect(result).toEqual({ dispatched: true });
      expect(router.queue.size()).toBe(1);
      expect(router.queue.peek()?.prompt).toBe('ls');
    });

    it('自动注入 createdAt（UTC 时间戳）', async () => {
      const router = registerRouter('s', 'w', 0);
      await dispatch('s', 'w', 0, { prompt: 'ls' });
      const instruct = router.queue.peek();
      expect(instruct?.createdAt).toBeDefined();
      expect(typeof instruct?.createdAt).toBe('string');
      expect(instruct?.createdAt.length).toBeGreaterThan(0);
    });

    it('触发 router 的 roller', async () => {
      const router = registerRouter('s', 'w', 0);
      await dispatch('s', 'w', 0, { prompt: 'ls' });
      expect(router.paneRolling).toHaveBeenCalled();
    });

    it('未注册 router 时返回 dispatched=false 且原因为 no-router', async () => {
      const result = await dispatch('s', 'w', 0, { prompt: 'ls' });
      expect(result).toEqual({ dispatched: false, reason: 'no-router' });
      expect(mockPaneRolling).not.toHaveBeenCalled();
    });

    it('router 处于 running 时拒绝分发，不入队也不触发 roller', async () => {
      const router = registerRouter('s', 'w', 0);
      router.paneStatus.status = 'running';
      const result = await dispatch('s', 'w', 0, { prompt: 'ls' });
      expect(result).toEqual({ dispatched: false, reason: 'busy' });
      expect(router.queue.size()).toBe(0);
      expect(router.paneRolling).not.toHaveBeenCalled();
    });

    it('分发成功后把 pane 状态置为 running', async () => {
      const router = registerRouter('s', 'w', 0);
      await dispatch('s', 'w', 0, { prompt: 'ls' });
      expect(router.paneStatus.status).toBe('running');
    });

    it('router 处于 error 时允许覆盖提交并置为 running', async () => {
      const router = registerRouter('s', 'w', 0);
      router.paneStatus.status = 'error';
      const result = await dispatch('s', 'w', 0, { prompt: 'ls' });
      expect(result).toEqual({ dispatched: true });
      expect(router.paneStatus.status).toBe('running');
    });
  });

  describe('getPaneStatus', () => {
    it('未注册 router 时返回 null', () => {
      expect(getPaneStatus('s', 'w', 0)).toBeNull();
    });

    it('已注册时返回绑定坐标的 pane 状态', () => {
      const router = registerRouter('s', 'w', 0);
      router.paneStatus.status = 'running';
      expect(getPaneStatus('s', 'w', 0)).toEqual({ session: 's', window: 'w', paneIndex: 0, status: 'running' });
    });
  });

  describe('registerRouter', () => {
    it('以 pane 坐标构造并存储 router', () => {
      const router = registerRouter('s', 'w', 0);
      expect(mockPaneRolling).toHaveBeenCalledWith('s', 'w', 0);
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

  describe('triggerPaneRolling', () => {
    it('调用 router 的 paneRolling 方法', () => {
      const router = registerRouter('s', 'w', 0);
      void triggerPaneRolling('s', 'w', 0);
      expect(router.paneRolling).toHaveBeenCalled();
    });

    it('把 running 的 router 状态归位为 idle', () => {
      const router = registerRouter('s', 'w', 0);
      router.paneStatus.status = 'running';
      void triggerPaneRolling('s', 'w', 0);
      expect(router.paneStatus.status).toBe('idle');
    });

    it('未注册 router 时不报错', () => {
      expect(() => void triggerPaneRolling('s', 'w', 0)).not.toThrow();
    });
  });

  describe('markPaneError', () => {
    it('把 pane 状态置为 error', () => {
      const router = registerRouter('s', 'w', 0);
      expect(markPaneError('s', 'w', 0)).toBe(true);
      expect(router.paneStatus.status).toBe('error');
    });

    it('不触发 paneRolling（异常结束的回合不消费队列）', () => {
      const router = registerRouter('s', 'w', 0);
      markPaneError('s', 'w', 0);
      expect(router.paneRolling).not.toHaveBeenCalled();
    });

    it('未注册 router 时返回 false 且不报错', () => {
      expect(markPaneError('s', 'w', 0)).toBe(false);
    });
  });
});
