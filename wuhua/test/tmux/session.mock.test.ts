import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExeca } = vi.hoisted(() => ({
  mockExeca: vi.fn()
}));

vi.mock('execa', () => ({
  execa: mockExeca
}));

vi.mock('../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import { isTmuxRunning } from '../../src/tmux/session';

describe('isTmuxRunning', () => {
  beforeEach(() => {
    mockExeca.mockReset();
  });

  it('tmux server 运行时返回 true', async () => {
    mockExeca.mockResolvedValue({ stdout: '0: my-session\n', stderr: '' });
    const result = await isTmuxRunning();
    expect(result).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['list-sessions']);
  });

  it('tmux server 未运行时返回 false', async () => {
    mockExeca.mockRejectedValue(new Error('no server running'));
    const result = await isTmuxRunning();
    expect(result).toBe(false);
  });
});
