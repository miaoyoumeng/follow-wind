import { describe, it, expect, beforeEach } from 'vitest';
import { InstructQueue } from '../../src/pipe/queue';
import type { Instruct } from '../../src/pipe/types';

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
      const instruct: Instruct = { command: 'ls' };
      queue.enqueue(instruct);
      expect(queue.isEmpty()).toBe(false);
      expect(queue.size()).toBe(1);
    });

    it('dequeue 按 FIFO 顺序返回指令', () => {
      const a: Instruct = { command: 'ls' };
      const b: Instruct = { command: 'pwd' };
      queue.enqueue(a);
      queue.enqueue(b);
      expect(queue.dequeue()).toBe(a);
      expect(queue.dequeue()).toBe(b);
      expect(queue.dequeue()).toBeUndefined();
    });

    it('peek 返回队首但不移除', () => {
      const instruct: Instruct = { command: 'ls' };
      queue.enqueue(instruct);
      expect(queue.peek()).toBe(instruct);
      expect(queue.size()).toBe(1);
    });

    it('peek 空队列时返回 undefined', () => {
      expect(queue.peek()).toBeUndefined();
    });

    it('clear 清空队列', () => {
      queue.enqueue({ command: 'ls' });
      queue.enqueue({ command: 'pwd' });
      queue.clear();
      expect(queue.isEmpty()).toBe(true);
      expect(queue.size()).toBe(0);
    });
  });
});
