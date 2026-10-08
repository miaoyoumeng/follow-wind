import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn()
}));

import { existsSync } from 'fs';
import { checkSettings } from '../../src/envs/settings';
import { getConfigPath } from '../../src/config';

describe('envs/settings checkSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('配置文件存在时返回 exists=true 与配置路径', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    const result = checkSettings();

    expect(result.exists).toBe(true);
    expect(result.path).toBe(getConfigPath());
  });

  it('配置文件不存在时返回 exists=false', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = checkSettings();

    expect(result.exists).toBe(false);
  });
});
