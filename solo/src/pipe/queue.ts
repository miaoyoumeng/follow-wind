import type { Instruct } from './types';

/**
 * 指令队列（FIFO）
 */
export class InstructQueue {
  private queue: Instruct[] = [];

  /** 入队 */
  enqueue(instruct: Instruct): void {
    this.queue.push(instruct);
  }

  /** 插入队首（用于发送失败后优先重试） */
  enqueueFront(instruct: Instruct): void {
    this.queue.unshift(instruct);
  }

  /** 出队（空队列返回 undefined） */
  dequeue(): Instruct | undefined {
    return this.queue.shift();
  }

  /** 查看队首（不移除） */
  peek(): Instruct | undefined {
    return this.queue[0];
  }

  /** 是否为空 */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /** 队列长度 */
  size(): number {
    return this.queue.length;
  }

  /** 清空队列 */
  clear(): void {
    this.queue = [];
  }
}
