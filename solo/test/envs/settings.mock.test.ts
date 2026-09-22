import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn()
}));

import { existsSync } from 'fs';
import { SettingsHandler } from '../../src/envs/settings';
import { getConfigPath } from '../../src/config';

describe('envs/settings SettingsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('配置文件存在时返回 exists=true', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const handler = new SettingsHandler();

    const result = handler.handle();

    expect(result.settings?.exists).toBe(true);
    expect(result.settings?.path).toBe(getConfigPath());
  });

  it('配置文件不存在时返回 exists=false', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const handler = new SettingsHandler();

    const result = handler.handle();

    expect(result.settings?.exists).toBe(false);
  });
});
