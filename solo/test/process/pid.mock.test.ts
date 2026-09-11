import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';

const { mockWriteFile, mockReadFile } = vi.hoisted(() => ({
  mockWriteFile: vi.fn(),
  mockReadFile: vi.fn()
}));

// 文件 IO 为外部依赖，mock 以隔离 PID 文件读写逻辑
vi.mock('../../src/utils', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile
}));

vi.mock(import('../../src/logging'), async importOriginal => {
  const actual = await importOriginal();
  return { ...actual };
});

vi.mock('../../src/config/paths', () => {
  const tmpDir = join('/tmp', 'solo-test-pid');
  return {
    PID_PATH: join(tmpDir, 'pid')
  };
});

import { writePidFile, readPidFile } from '../../src/process/pid';

describe('writePidFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('将当前进程 PID 写入 PID_PATH', () => {
    writePidFile();
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('pid'),
      String(process.pid)
    );
  });

});

describe('readPidFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('文件不存在时返回 null', () => {
    mockReadFile.mockReturnValue(null);
    expect(readPidFile()).toBeNull();
  });

  it('文件内容为合法数字时返回 PID', () => {
    mockReadFile.mockReturnValue('12345');
    expect(readPidFile()).toBe(12345);
  });

  it('文件内容包含空白字符时自动 trim', () => {
    mockReadFile.mockReturnValue('  67890  \n');
    expect(readPidFile()).toBe(67890);
  });

  it('文件内容为非法值时返回 null', () => {
    mockReadFile.mockReturnValue('not-a-number');
    expect(readPidFile()).toBeNull();
  });
});
