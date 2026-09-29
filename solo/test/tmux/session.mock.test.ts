import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExecAsync } = vi.hoisted(() => ({
  mockExecAsync: vi.fn()
}));

vi.mock('../../src/process', () => ({
  execAsync: mockExecAsync,
  exec: { fn: mockExecAsync }
}));

vi.mock('../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import { isTmuxRunning } from '../../src/tmux/session';

describe('isTmuxRunning', () => {
  beforeEach(() => {
    mockExecAsync.mockReset();
  });

  it('tmux server 运行时返回 true', async () => {
    mockExecAsync.mockResolvedValue({ stdout: '0: my-session\n', stderr: '' });
    const result = await isTmuxRunning();
    expect(result).toBe(true);
    expect(mockExecAsync).toHaveBeenCalledWith('tmux list-sessions 2>/dev/null');
  });

  it('tmux server 未运行时返回 false', async () => {
    mockExecAsync.mockRejectedValue(new Error('no server running'));
    const result = await isTmuxRunning();
    expect(result).toBe(false);
  });
});
