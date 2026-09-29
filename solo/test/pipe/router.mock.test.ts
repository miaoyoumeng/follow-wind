import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as TmuxType from '../../src/tmux';

const { mockSendKeysEnter, mockSelectPane } = vi.hoisted(() => ({
  mockSendKeysEnter: vi.fn(),
  mockSelectPane: vi.fn()
}));

vi.mock('../../src/tmux', async () => {
  const actual = await vi.importActual<typeof TmuxType>('../../src/tmux');
  return {
    ...actual,
    sendKeysEnter: mockSendKeysEnter,
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

describe('TmuxRouter', () => {
  beforeEach(() => {
    mockSendKeysEnter.mockReset();
    mockSelectPane.mockReset();
    mockSendKeysEnter.mockResolvedValue(undefined);
    mockSelectPane.mockResolvedValue(undefined);
  });

  describe('构造', () => {
    it('属性正确初始化为默认值', () => {
      const router = new TmuxRouter();
      expect(router.session).toBe('');
      expect(router.window).toBe('');
      expect(router.paneIndex).toBe(0);
      expect(router.isStable).toBe(true);
      expect(router.queue.isEmpty()).toBe(true);
    });
  });

  describe('enqueue()', () => {
    it('将指令加入队列', () => {
      const router = new TmuxRouter();
      router.enqueue({ command: 'ls' });
      expect(router.queue.size()).toBe(1);
      expect(router.queue.peek()?.command).toBe('ls');
    });

    it('多次调用依次入队', () => {
      const router = new TmuxRouter();
      router.enqueue({ command: 'ls' });
      router.enqueue({ command: 'pwd' });
      expect(router.queue.size()).toBe(2);
    });
  });

  describe('paneRolling()', () => {
    it('isStable 为 false 时提前返回，不执行指令', async () => {
      const router = new TmuxRouter();
      Object.assign(router, { session: 's', window: 'w', paneIndex: 0 });
      router.isStable = false;
      router.queue.enqueue({ command: 'ls' });
      await router.paneRolling();
      expect(mockSelectPane).not.toHaveBeenCalled();
      expect(mockSendKeysEnter).not.toHaveBeenCalled();
      expect(router.queue.size()).toBe(1);
    });

    it('队列为空时不执行任何操作', async () => {
      const router = new TmuxRouter();
      Object.assign(router, { session: 's', window: 'w', paneIndex: 0 });
      await router.paneRolling();
      expect(mockSelectPane).not.toHaveBeenCalled();
      expect(mockSendKeysEnter).not.toHaveBeenCalled();
    });

    it('发送指令前调用 selectPane，然后 sendKeysEnter，并设置 isStable=false', async () => {
      const router = new TmuxRouter();
      Object.assign(router, { session: 's', window: 'w', paneIndex: 0 });
      router.queue.enqueue({ command: 'ls -la' });
      await router.paneRolling();
      expect(mockSelectPane).toHaveBeenCalledWith('s', 'w', 0);
      expect(mockSendKeysEnter).toHaveBeenCalledWith('s', 'w', 0, 'ls -la');
      expect(router.isStable).toBe(false);
    });

    it('executeInstruct 失败时重置 isStable=true', async () => {
      const router = new TmuxRouter();
      Object.assign(router, { session: 's', window: 'w', paneIndex: 0 });
      mockSendKeysEnter.mockRejectedValueOnce(new Error('send failed'));
      router.queue.enqueue({ command: 'ls' });
      await router.paneRolling();
      expect(router.isStable).toBe(true);
    });
  });

  describe('markStable()', () => {
    it('设置 isStable 为 true', () => {
      const router = new TmuxRouter();
      router.isStable = false;
      router.markStable();
      expect(router.isStable).toBe(true);
    });

    it('多次调用不会报错', () => {
      const router = new TmuxRouter();
      router.markStable();
      router.markStable();
      expect(router.isStable).toBe(true);
    });
  });
});
