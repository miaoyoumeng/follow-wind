import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExeca } = vi.hoisted(() => ({
  mockExeca: vi.fn()
}));

vi.mock('execa', () => ({
  execa: mockExeca
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

import { checkGit, checkClaude, checkTmux } from '../../src/envs/tool';

describe('envs/tool', () => {
  beforeEach(() => {
    mockExeca.mockReset();
  });

  it('命令执行成功时返回 installed=true 与去除首尾空白的版本号', async () => {
    mockExeca.mockResolvedValue({ stdout: 'git version 2.39.0\n', stderr: '' });

    const result = await checkGit();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('git version 2.39.0');
    expect(mockExeca).toHaveBeenCalledWith('git', ['--version']);
  });

  it('命令执行失败时返回 installed=false 且不含版本号', async () => {
    mockExeca.mockRejectedValue(new Error('command not found'));

    const result = await checkGit();

    expect(result.installed).toBe(false);
    expect(result.version).toBeUndefined();
  });

  it('checkClaude 执行 claude --version', async () => {
    mockExeca.mockResolvedValue({ stdout: '1.0.0\n', stderr: '' });

    await checkClaude();

    expect(mockExeca).toHaveBeenCalledWith('claude', ['--version']);
  });

  it('checkTmux 执行 tmux -V', async () => {
    mockExeca.mockResolvedValue({ stdout: 'tmux 3.3a\n', stderr: '' });

    await checkTmux();

    expect(mockExeca).toHaveBeenCalledWith('tmux', ['-V']);
  });
});
