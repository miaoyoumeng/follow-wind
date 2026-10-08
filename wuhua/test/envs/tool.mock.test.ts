import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/process', () => ({
  execAsync: vi.fn()
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

import { execAsync } from '../../src/process';
import { checkGit, checkClaude, checkTmux } from '../../src/envs/tool';

describe('envs/tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('命令执行成功时返回 installed=true 与去除首尾空白的版本号', async () => {
    vi.mocked(execAsync).mockResolvedValue({ stdout: 'git version 2.39.0\n', stderr: '' });

    const result = await checkGit();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('git version 2.39.0');
    expect(execAsync).toHaveBeenCalledWith('git --version');
  });

  it('命令执行失败时返回 installed=false 且不含版本号', async () => {
    vi.mocked(execAsync).mockRejectedValue(new Error('command not found'));

    const result = await checkGit();

    expect(result.installed).toBe(false);
    expect(result.version).toBeUndefined();
  });

  it('checkClaude 执行 claude --version', async () => {
    vi.mocked(execAsync).mockResolvedValue({ stdout: '1.0.0\n', stderr: '' });

    await checkClaude();

    expect(execAsync).toHaveBeenCalledWith('claude --version');
  });

  it('checkTmux 执行 tmux -V', async () => {
    vi.mocked(execAsync).mockResolvedValue({ stdout: 'tmux 3.3a\n', stderr: '' });

    await checkTmux();

    expect(execAsync).toHaveBeenCalledWith('tmux -V');
  });
});
