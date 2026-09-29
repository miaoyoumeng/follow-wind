import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn()
  }
}));

import { pollingWithTimeout } from '../../src/task/loop';
import type { Task } from '../../src/task/types';

describe('pollingWithTimeout', () => {
  const task: Task = {
    id: 't1',
    name: 'agent1',
    type: 'tmux',
    status: 'running',
    createdAt: '2026-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('roller 返回 true 时，提前终止轮询', async () => {
    const roller = vi.fn().mockReturnValue(true);
    const timeoutRunner = vi.fn();

    pollingWithTimeout(task, roller, timeoutRunner);

    // 第一次 interval 触发（30s）
    await vi.advanceTimersByTimeAsync(30_000);
    expect(roller).toHaveBeenCalledTimes(1);

    // 后续 interval 不应再触发
    await vi.advanceTimersByTimeAsync(60_000);
    expect(roller).toHaveBeenCalledTimes(1);
    expect(timeoutRunner).not.toHaveBeenCalled();
  });

  it('roller 返回 false 时，继续轮询', async () => {
    const roller = vi.fn().mockReturnValue(false);
    const timeoutRunner = vi.fn();

    pollingWithTimeout(task, roller, timeoutRunner);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(roller).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(roller).toHaveBeenCalledTimes(2);
  });
});
