import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn()
}));

// fs 是最低层外部依赖，mock 以隔离 getLoggingConfig 的读取逻辑
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: mockReadFileSync,
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

import { getLoggingConfig } from '../../../src/logging/config';

describe('getLoggingConfig', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
  });

  it('配置文件中存在 logging 段时，返回 { level, file } 对象', () => {
    mockReadFileSync.mockReturnValue(`name: 'test'
logging:
  level: 'debug'
  file: '/tmp/solo.log'
`);
    expect(getLoggingConfig()).toEqual({ level: 'debug', file: '/tmp/solo.log' });
  });

  it('未配置 logging 段时，返回 null', () => {
    mockReadFileSync.mockReturnValue(`name: 'test'
`);
    expect(getLoggingConfig()).toBeNull();
  });
});
