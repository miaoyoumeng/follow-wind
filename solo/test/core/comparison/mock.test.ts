import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCapturePane, mockReadFileSync, mockWriteFileSync, mockMkdirSync } = vi.hoisted(() => ({
  mockCapturePane: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockMkdirSync: vi.fn()
}));

// tmux 是外部 tmux 命令依赖，mock 以隔离 pane 捕获逻辑
vi.mock('../../../src/tmux', () => ({
  capturePane: mockCapturePane
}));

// fs 是文件操作依赖，mock 以隔离磁盘读写
vi.mock('fs', () => ({
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync
}));

import { compareWithStored } from '../../../src/core/comparison';

describe('compareWithStored', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('存储文件不存在时，返回 changed: true', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockCapturePane.mockResolvedValue('current content');

    const result = await compareWithStored('sess', 'win', 0, '/test/file.md');

    expect(result.changed).toBe(true);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('存储文件不存在且 saveOnChange 为 true 时，保存当前内容为初始快照', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockCapturePane.mockResolvedValue('current content');

    const result = await compareWithStored('sess', 'win', 0, '/test/file.md', true);

    expect(result.changed).toBe(true);
    expect(mockMkdirSync).toHaveBeenCalledWith('/test', { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith('/test/file.md', 'current content');
  });

  it('内容一致时，返回 changed: false', async () => {
    mockReadFileSync.mockReturnValue('same content');
    mockCapturePane.mockResolvedValue('same content');

    const result = await compareWithStored('sess', 'win', 0, '/test/file.md');

    expect(result.changed).toBe(false);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('内容不一致且 saveOnChange 为 false 时，返回 changed: true，不写入文件', async () => {
    mockReadFileSync.mockReturnValue('old content');
    mockCapturePane.mockResolvedValue('new content');

    const result = await compareWithStored('sess', 'win', 0, '/test/file.md', false);

    expect(result.changed).toBe(true);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('内容不一致且 saveOnChange 为 true 时，返回 changed: true 并写入文件', async () => {
    mockReadFileSync.mockReturnValue('old content');
    mockCapturePane.mockResolvedValue('new content');

    const result = await compareWithStored('sess', 'win', 0, '/test/file.md', true);

    expect(result.changed).toBe(true);
    expect(mockMkdirSync).toHaveBeenCalledWith('/test', { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith('/test/file.md', 'new content');
  });

  it('正确传递 session、window、paneIndex 给 capturePane', async () => {
    mockReadFileSync.mockReturnValue('stored');
    mockCapturePane.mockResolvedValue('stored');

    await compareWithStored('my-session', 'my-window', 3, '/test/file.md');

    expect(mockCapturePane).toHaveBeenCalledWith('my-session', 'my-window', 3);
  });
});
