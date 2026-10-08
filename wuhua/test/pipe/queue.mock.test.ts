import { describe, it, expect, beforeEach } from 'vitest';
import { InstructQueue } from '../../src/pipe/queue';
import type { Instruct } from '../../src/pipe/types';

const NOW = '2026-09-30T00:00:00.000Z';

describe('InstructQueue', () => {
  let queue: InstructQueue;

  beforeEach(() => {
    queue = new InstructQueue();
  });

  describe('基本行为', () => {
    it('新建队列时为空', () => {
      expect(queue.isEmpty()).toBe(true);
      expect(queue.size()).toBe(0);
    });

    it('enqueue 后队列非空且 size 增加', () => {
      const instruct: Instruct = { prompt: 'ls', createdAt: NOW };
      queue.enqueue(instruct);
      expect(queue.isEmpty()).toBe(false);
      expect(queue.size()).toBe(1);
    });

    it('dequeue 按 FIFO 顺序返回指令', () => {
      const a: Instruct = { prompt: 'ls', createdAt: NOW };
      const b: Instruct = { prompt: 'pwd', createdAt: NOW };
      queue.enqueue(a);
      queue.enqueue(b);
      expect(queue.dequeue()).toBe(a);
      expect(queue.dequeue()).toBe(b);
      expect(queue.dequeue()).toBeUndefined();
    });

    it('peek 返回队首但不移除', () => {
      const instruct: Instruct = { prompt: 'ls', createdAt: NOW };
      queue.enqueue(instruct);
      expect(queue.peek()).toBe(instruct);
      expect(queue.size()).toBe(1);
    });

    it('peek 空队列时返回 undefined', () => {
      expect(queue.peek()).toBeUndefined();
    });

    it('clear 清空队列', () => {
      queue.enqueue({ prompt: 'ls', createdAt: NOW });
      queue.enqueue({ prompt: 'pwd', createdAt: NOW });
      queue.clear();
      expect(queue.isEmpty()).toBe(true);
      expect(queue.size()).toBe(0);
    });
  });

  describe('enqueueFront()', () => {
    it('插入队首，优先于先入队者出队', () => {
      const first: Instruct = { prompt: 'first', createdAt: NOW };
      const retry: Instruct = { prompt: 'retry', createdAt: NOW };
      queue.enqueue(first);
      queue.enqueueFront(retry);
      expect(queue.size()).toBe(2);
      expect(queue.dequeue()).toBe(retry);
      expect(queue.dequeue()).toBe(first);
    });

    it('空队列时等价于 enqueue', () => {
      const instruct: Instruct = { prompt: 'ls', createdAt: NOW };
      queue.enqueueFront(instruct);
      expect(queue.size()).toBe(1);
      expect(queue.peek()).toBe(instruct);
    });
  });
});
