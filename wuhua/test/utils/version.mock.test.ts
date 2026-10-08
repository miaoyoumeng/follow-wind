import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVersion } from '../../src/utils/version';
import * as files from '../../src/utils/files';

vi.mock('../../src/utils/files', () => ({
  readFile: vi.fn()
}));

describe('getVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('package.json 无 version 字段时返回 unknown', () => {
    vi.mocked(files.readFile).mockReturnValue(JSON.stringify({ name: 'solo' }));
    expect(getVersion()).toBe('unknown');
  });

  it('package.json 有 version 字段时返回版本号字符串', () => {
    vi.mocked(files.readFile).mockReturnValue(JSON.stringify({ name: 'solo', version: '1.2.3' }));
    expect(getVersion()).toBe('1.2.3');
  });

  it('package.json 读取失败时抛出异常', () => {
    vi.mocked(files.readFile).mockReturnValue(null);
    expect(() => getVersion()).toThrow('Cannot read package.json');
  });
});
