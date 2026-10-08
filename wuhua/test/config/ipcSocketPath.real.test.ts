import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { getIpcSocketPath, SOLO_DIR, getConfigPath, setConfigPath } from '../../src/config';

describe('getIpcSocketPath', () => {
  it('返回 .solo/ipc-[name].sock 完整路径', () => {
    expect(getIpcSocketPath('myproject')).toBe(join(SOLO_DIR, 'ipc-myproject.sock'));
  });

  it('不同 name 返回不同路径', () => {
    const a = getIpcSocketPath('alpha');
    const b = getIpcSocketPath('beta');
    expect(a).not.toBe(b);
    expect(a).toContain('ipc-alpha.sock');
    expect(b).toContain('ipc-beta.sock');
  });
});

describe('configPath 管理', () => {
  let originalPath: string;

  beforeEach(() => {
    originalPath = getConfigPath();
  });

  afterEach(() => {
    setConfigPath(originalPath);
  });

  it('setConfigPath 后 getConfigPath 返回新路径', () => {
    setConfigPath('/custom/config.yaml');
    expect(getConfigPath()).toBe('/custom/config.yaml');
  });

  it('setConfigPath 可恢复为之前的值', () => {
    setConfigPath('/other.yaml');
    setConfigPath(originalPath);
    expect(getConfigPath()).toBe(originalPath);
  });
});
