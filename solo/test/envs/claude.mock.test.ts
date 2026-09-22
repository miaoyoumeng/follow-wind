import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/process', () => ({
  execAsync: vi.fn()
}));

import { execAsync } from '../../src/process';
import { ClaudeHandler } from '../../src/envs/claude';

describe('envs/claude ClaudeHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('claude 已安装时返回 installed=true 和版本', async () => {
    vi.mocked(execAsync).mockResolvedValue({ stdout: 'claude version 1.0.0\n', stderr: '' });
    const handler = new ClaudeHandler();

    const result = await handler.handle();

    expect(result.claude?.installed).toBe(true);
    expect(result.claude?.version).toBe('claude version 1.0.0');
  });

  it('claude 未安装时返回 installed=false', async () => {
    vi.mocked(execAsync).mockRejectedValue(new Error('not found'));
    const handler = new ClaudeHandler();

    const result = await handler.handle();

    expect(result.claude?.installed).toBe(false);
    expect(result.claude?.version).toBeUndefined();
  });
});
