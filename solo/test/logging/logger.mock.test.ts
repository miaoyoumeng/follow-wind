import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAppendFileSync, mockMkdirSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockAppendFileSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockWriteFileSync: vi.fn()
}));

// fs 是最低层外部依赖，mock 以隔离日志写入逻辑
vi.mock('fs', () => ({
  appendFileSync: mockAppendFileSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync
}));

import { setup, debug, info, warn, error, reset } from '../../../src/logging/logger';

describe('logger', () => {
  beforeEach(() => {
    mockAppendFileSync.mockReset();
    mockMkdirSync.mockReset();
    mockWriteFileSync.mockReset();
    reset();
  });

  it('setup 应调用 mkdirSync 确保日志目录存在', () => {
    setup({ level: 'debug', file: '/tmp/solo.log' });
    expect(mockMkdirSync).toHaveBeenCalledWith('/tmp', { recursive: true });
  });

  it('setup 应调用 writeFileSync 创建空日志文件', () => {
    setup({ level: 'debug', file: '/tmp/solo.log' });
    expect(mockWriteFileSync).toHaveBeenCalledWith('/tmp/solo.log', '');
  });

  it('setup 后调用 info 应写入带时间戳和前缀的日志到文件', () => {
    setup({ level: 'info', file: '/tmp/solo.log' });
    info('hello');
    expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
    const [filePath, content] = mockAppendFileSync.mock.calls[0];
    expect(filePath).toBe('/tmp/solo.log');
    expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[INFO\] hello\n$/);
  });

  it('setup 未调用时，所有日志函数为空操作', () => {
    debug('a');
    info('b');
    warn('c');
    error('d');
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  it('level=warn 时，debug 和 info 被过滤，warn 和 error 写入文件', () => {
    setup({ level: 'warn', file: '/tmp/solo.log' });
    debug('d');
    info('i');
    warn('w');
    error('e');
    expect(mockAppendFileSync).toHaveBeenCalledTimes(2);
    const contents = mockAppendFileSync.mock.calls.map((c: unknown[]) => c[1] as string);
    expect(contents[0]).toContain('[WARN] w');
    expect(contents[1]).toContain('[ERROR] e');
  });

  it('level=error 时，只有 error 写入文件', () => {
    setup({ level: 'error', file: '/tmp/solo.log' });
    debug('d');
    info('i');
    warn('w');
    error('e');
    expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
    expect(mockAppendFileSync.mock.calls[0][1]).toContain('[ERROR] e');
  });

  it('level=debug 时，所有级别均写入文件', () => {
    setup({ level: 'debug', file: '/tmp/solo.log' });
    debug('d');
    info('i');
    warn('w');
    error('e');
    expect(mockAppendFileSync).toHaveBeenCalledTimes(4);
  });
});
