import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as TmuxType from '../../src/tmux';

const { mockSendKeys, mockSelectPane } = vi.hoisted(() => ({
  mockSendKeys: vi.fn(),
  mockSelectPane: vi.fn()
}));

vi.mock('../../src/tmux', async () => {
  const actual = await vi.importActual<typeof TmuxType>('../../src/tmux');
  return {
    ...actual,
    sendKeys: mockSendKeys,
    selectPane: mockSelectPane
  };
});

vi.mock('../../src/logging', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

import { TmuxRouter } from '../../src/pipe/router';

const NOW = '2026-09-30T00:00:00.000Z';

describe('TmuxRouter', () => {
  beforeEach(() => {
    mockSendKeys.mockReset();
    mockSelectPane.mockReset();
    mockSendKeys.mockResolvedValue(undefined);
    mockSelectPane.mockResolvedValue(undefined);
  });

  describe('构造', () => {
    it('构造参数被正确赋值，队列为空', () => {
      const router = new TmuxRouter('s', 'w', 2);
      expect(router.session).toBe('s');
      expect(router.window).toBe('w');
      expect(router.paneIndex).toBe(2);
      expect(router.queue.isEmpty()).toBe(true);
    });
  });

  describe('enqueue()', () => {
    it('将指令加入队列', () => {
      const router = new TmuxRouter('s', 'w', 0);
      router.enqueue({ prompt: 'ls', createdAt: NOW });
      expect(router.queue.size()).toBe(1);
      expect(router.queue.peek()?.prompt).toBe('ls');
    });

    it('多次调用依次入队', () => {
      const router = new TmuxRouter('s', 'w', 0);
      router.enqueue({ prompt: 'ls', createdAt: NOW });
      router.enqueue({ prompt: 'pwd', createdAt: NOW });
      expect(router.queue.size()).toBe(2);
    });
  });

  describe('paneRolling()', () => {
    it('队列为空时不执行任何操作', async () => {
      const router = new TmuxRouter('s', 'w', 0);
      await router.paneRolling();
      expect(mockSelectPane).not.toHaveBeenCalled();
      expect(mockSendKeys).not.toHaveBeenCalled();
    });

    it('发送指令前调用 selectPane，然后 sendKeys', async () => {
      const router = new TmuxRouter('s', 'w', 0);
      router.queue.enqueue({ prompt: 'ls -la', createdAt: NOW });
      await router.paneRolling();
      expect(mockSelectPane).toHaveBeenCalledWith('s', 'w', 0);
      expect(mockSendKeys).toHaveBeenCalledWith('s', 'w', 0, 'ls -la');
    });

    it('sendKeys 失败时不抛出异常，并将指令放回队首且递增重试计数', async () => {
      const router = new TmuxRouter('s', 'w', 0);
      mockSendKeys.mockRejectedValueOnce(new Error('send failed'));
      router.queue.enqueue({ prompt: 'ls', createdAt: NOW });

      await expect(router.paneRolling()).resolves.not.toThrow();

      expect(router.queue.size()).toBe(1);
      expect(router.queue.peek()?.prompt).toBe('ls');
      expect(router.queue.peek()?.retryCount).toBe(1);
    });

    it('重试的指令优先于其后入队的指令', async () => {
      const router = new TmuxRouter('s', 'w', 0);
      mockSendKeys.mockRejectedValueOnce(new Error('send failed'));
      router.queue.enqueue({ prompt: 'first', createdAt: NOW });
      router.queue.enqueue({ prompt: 'second', createdAt: NOW });

      await router.paneRolling();

      expect(router.queue.size()).toBe(2);
      expect(router.queue.peek()?.prompt).toBe('first');
    });

    it('重试计数逐次递增，达到上限后丢弃指令', async () => {
      const router = new TmuxRouter('s', 'w', 0);
      mockSendKeys.mockRejectedValue(new Error('send failed'));
      router.queue.enqueue({ prompt: 'ls', createdAt: NOW });

      await router.paneRolling();
      expect(router.queue.peek()?.retryCount).toBe(1);

      await router.paneRolling();
      expect(router.queue.peek()?.retryCount).toBe(2);

      await router.paneRolling();
      expect(router.queue.isEmpty()).toBe(true);
    });

    it('失败一次后重试成功则指令出队且不再入队', async () => {
      const router = new TmuxRouter('s', 'w', 0);
      mockSendKeys.mockRejectedValueOnce(new Error('send failed'));
      router.queue.enqueue({ prompt: 'ls', createdAt: NOW });

      await router.paneRolling();
      await router.paneRolling();

      expect(router.queue.isEmpty()).toBe(true);
    });
  });
});
