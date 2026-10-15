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

import { createSession, isTmuxRunning } from '../../src/tmux/session';

describe('createSession', () => {
  beforeEach(() => {
    mockExeca.mockReset();
    mockExeca.mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('未指定 window 名时沿用 tmux 默认 window', async () => {
    await createSession('sess', undefined, '/a');
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['new-session', '-d', '-s', 'sess', '-c', '/a']);
  });

  it('指定 window 名与目录时作为首个 window 的名称和工作目录', async () => {
    await createSession('sess', 'agent-a', '/a');
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['new-session', '-d', '-s', 'sess', '-c', '/a', '-n', 'agent-a']);
  });

  it('未指定目录时使用当前进程工作目录', async () => {
    await createSession('sess', 'agent-a');
    expect(mockExeca).toHaveBeenCalledWith('tmux', [
      'new-session',
      '-d',
      '-s',
      'sess',
      '-c',
      process.cwd(),
      '-n',
      'agent-a'
    ]);
  });
});

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
