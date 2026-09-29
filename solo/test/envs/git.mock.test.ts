import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/process', () => ({
  execAsync: vi.fn()
}));

import { execAsync } from '../../src/process';
import { GitHandler } from '../../src/envs/git';

describe('envs/git GitHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('git 已安装时返回 installed=true 和版本', async () => {
    vi.mocked(execAsync).mockResolvedValue({ stdout: 'git version 2.39.0\n', stderr: '' });
    const handler = new GitHandler();

    const result = await handler.handle();

    expect(result.git?.installed).toBe(true);
    expect(result.git?.version).toBe('git version 2.39.0');
  });

  it('git 未安装时返回 installed=false', async () => {
    vi.mocked(execAsync).mockRejectedValue(new Error('not found'));
    const handler = new GitHandler();

    const result = await handler.handle();

    expect(result.git?.installed).toBe(false);
    expect(result.git?.version).toBeUndefined();
  });
});
