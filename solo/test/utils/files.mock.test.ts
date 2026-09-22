import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync, statSync, readdirSync } from 'fs';

vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  appendFileSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn()
}));

import { ensureDir, writeFile, readFile, appendFile, exists, stat, readDir } from '../../src/utils/files';

describe('utils/files 文件操作工具', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDir', () => {
    it('调用 mkdirSync 创建目录（recursive: true）', () => {
      ensureDir('/test/dir');
      expect(mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });
  });

  describe('writeFile', () => {
    it('自动创建父目录后写入文件', () => {
      writeFile('/test/dir/file.txt', 'content');
      expect(mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
      expect(writeFileSync).toHaveBeenCalledWith('/test/dir/file.txt', 'content');
    });
  });

  describe('readFile', () => {
    it('文件存在时返回内容', () => {
      vi.mocked(readFileSync).mockReturnValue('file content');
      const result = readFile('/test/file.txt');
      expect(result).toBe('file content');
      expect(readFileSync).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('文件不存在时返回 null', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      const result = readFile('/test/missing.txt');
      expect(result).toBeNull();
    });
  });

  describe('appendFile', () => {
    it('自动创建父目录后追加内容', () => {
      appendFile('/test/dir/file.txt', 'content');
      expect(mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
      expect(appendFileSync).toHaveBeenCalledWith('/test/dir/file.txt', 'content');
    });
  });

  describe('exists', () => {
    it('文件存在时返回 true', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      expect(exists('/test/file.txt')).toBe(true);
      expect(existsSync).toHaveBeenCalledWith('/test/file.txt');
    });

    it('文件不存在时返回 false', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      expect(exists('/test/missing.txt')).toBe(false);
    });
  });

  describe('stat', () => {
    it('返回文件统计信息', () => {
      const mockStat = { mtimeMs: 1234567890, size: 100 };
      vi.mocked(statSync).mockReturnValue(mockStat as unknown as ReturnType<typeof statSync>);
      const result = stat('/test/file.txt');
      expect(result).toBe(mockStat);
      expect(statSync).toHaveBeenCalledWith('/test/file.txt');
    });
  });

  describe('readDir', () => {
    it('返回目录条目列表', () => {
      vi.mocked(readdirSync).mockReturnValue(['file1.txt', 'file2.txt'] as unknown as ReturnType<typeof readdirSync>);
      const result = readDir('/test/dir');
      expect(result).toEqual(['file1.txt', 'file2.txt']);
      expect(readdirSync).toHaveBeenCalledWith('/test/dir');
    });
  });
});
