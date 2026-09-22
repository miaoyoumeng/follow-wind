import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/process', () => ({
  execAsync: vi.fn()
}));

import { execAsync } from '../../src/process';
import { TmuxHandler } from '../../src/envs/tmux';

describe('envs/tmux TmuxHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tmux 已安装时返回 installed=true 和版本', async () => {
    vi.mocked(execAsync).mockResolvedValue({ stdout: 'tmux 3.3a\n', stderr: '' });
    const handler = new TmuxHandler();

    const result = await handler.handle();

    expect(result.tmux?.installed).toBe(true);
    expect(result.tmux?.version).toBe('tmux 3.3a');
  });

  it('tmux 未安装时返回 installed=false', async () => {
    vi.mocked(execAsync).mockRejectedValue(new Error('not found'));
    const handler = new TmuxHandler();

    const result = await handler.handle();

    expect(result.tmux?.installed).toBe(false);
    expect(result.tmux?.version).toBeUndefined();
  });
});
