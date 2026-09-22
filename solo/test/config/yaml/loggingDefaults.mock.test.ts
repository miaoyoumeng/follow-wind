import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn()
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: mockReadFileSync,
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

import { readConfig } from '../../../src/config/yaml/writer';
import { resolveLoggingConfig, LOG_FILE } from '../../../src/config';

describe('resolveLoggingConfig 默认值', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
  });

  it('logging 完整配置时原样返回', () => {
    const resolved = resolveLoggingConfig({ level: 'info', file: '/tmp/solo.log' });
    expect(resolved).toEqual({ level: 'info', file: '/tmp/solo.log' });
  });

  it('logging 为 null 时返回完整默认值', () => {
    const resolved = resolveLoggingConfig(null);
    expect(resolved.level).toBe('warn');
    expect(resolved.file).toBe(LOG_FILE);
  });

  it('logging 为 undefined 时返回完整默认值', () => {
    const resolved = resolveLoggingConfig(undefined);
    expect(resolved.level).toBe('warn');
    expect(resolved.file).toBe(LOG_FILE);
  });

  it('只配置 level 时，file 使用默认值', () => {
    const resolved = resolveLoggingConfig({ level: 'debug' });
    expect(resolved.level).toBe('debug');
    expect(resolved.file).toBe(LOG_FILE);
  });

  it('只配置 file 时，level 使用默认值 warn', () => {
    const resolved = resolveLoggingConfig({ file: '/custom/path.log' });
    expect(resolved.level).toBe('warn');
    expect(resolved.file).toBe('/custom/path.log');
  });
});

describe('readConfig logging 默认值行为', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
  });

  it('未配置 logging 段时，resolveLoggingConfig 返回默认值', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
agents:
  pm:
    workspace: '/pm'
`);
    const config = readConfig();
    const resolved = resolveLoggingConfig(config.logging ?? null);
    expect(resolved.level).toBe('warn');
    expect(resolved.file).toBe(LOG_FILE);
  });

  it('只配置 level 时，readConfig 解析出 level，file 由 resolveLoggingConfig 补默认值', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
logging:
  level: 'debug'
`);
    const config = readConfig();
    expect(config.logging?.level).toBe('debug');
    const resolved = resolveLoggingConfig(config.logging ?? null);
    expect(resolved.file).toBe(LOG_FILE);
  });

  it('LOG_FILE 默认路径为 .solo/solo.log', () => {
    expect(LOG_FILE).toBe(join(process.cwd(), '.solo', 'solo.log'));
  });
});
