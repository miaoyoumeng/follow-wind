import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { join } from 'path';

const {
  mockValidateWorkspace,
  mockGetAgent,
  mockCapturePane,
  mockMkdirSync,
  mockWriteFileSync,
  mockStatSync,
  mockLoggerInfo
} = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockGetAgent: vi.fn(),
  mockCapturePane: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockStatSync: vi.fn(),
  mockLoggerInfo: vi.fn()
}));

// commander 是外部 CLI 框架，mock 以阻止命令注册副作用
vi.mock('commander', () => {
  const proxy: Record<string, unknown> = new Proxy(function () {} as unknown as Record<string, unknown>, {
    get: (_t, prop) => (prop === 'then' ? undefined : proxy),
    apply: () => proxy
  });
  class MockCommand {
    constructor() {
      return proxy;
    }
  }
  return { Command: MockCommand };
});

// status 是环境校验依赖，mock 以隔离 runCapture 的调度逻辑
vi.mock('../../src/commander/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

// agents 是配置解析依赖，mock 以隔离 agent 查找逻辑
vi.mock('../../src/agents', () => ({
  getAgent: mockGetAgent
}));

// tmux 是外部 tmux 命令依赖，mock 以隔离 pane 捕获逻辑
vi.mock('../../src/tmux', () => ({
  capturePane: mockCapturePane
}));

// fs 是文件操作依赖，mock 以隔离磁盘读写与 stat 查询
vi.mock('fs', () => ({
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
  statSync: mockStatSync
}));

// logging 是日志输出依赖，mock 以隔离日志写入
vi.mock('../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: mockLoggerInfo, warn: vi.fn(), error: vi.fn() } as unknown,
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

import { runCapture } from '../../src/commander/capture';

describe('runCapture', () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateWorkspace.mockReturnValue('my-session');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  it('agent 不存在时抛出错误', async () => {
    mockGetAgent.mockReturnValue(undefined);
    await expect(runCapture('unknown', 0)).rejects.toThrow('agent "unknown" 不存在');
  });

  it('文件不存在时，捕获 pane 内容并覆盖写入', async () => {
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/app', activate: true });
    mockStatSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockCapturePane.mockResolvedValue('Hello\nWorld');

    await runCapture('frontend', 2);

    const expectedPath = join(process.cwd(), '.solo', 'capture', 'frontend-2.md');
    expect(mockMkdirSync).toHaveBeenCalledWith(join(process.cwd(), '.solo', 'capture'), { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith(expectedPath, 'Hello\nWorld');
  });

  it('文件 mtime 距当前不足 30 秒时，输出提示并终止，不捕获不写入', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(60_000); // now = 60s
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/app', activate: true });
    mockStatSync.mockReturnValue({ mtimeMs: 50_000 }); // mtime = 50s → elapsed = 10s

    await runCapture('frontend', 2);

    expect(mockCapturePane).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    const consoleOutput = consoleSpy.mock.calls[0][0] as string;
    expect(consoleOutput).toContain('截屏间隔时间少于30秒');
    expect(consoleOutput).toContain('20');
    expect(mockLoggerInfo).toHaveBeenCalledTimes(1);
    const logOutput = mockLoggerInfo.mock.calls[0][0] as string;
    expect(logOutput).toContain('截屏间隔时间少于30秒');
    expect(logOutput).toContain('20');
  });

  it('文件 mtime 距当前超过 30 秒时，正常捕获并写入', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000); // now = 100s
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/app', activate: true });
    mockStatSync.mockReturnValue({ mtimeMs: 50_000 }); // mtime = 50s → elapsed = 50s
    mockCapturePane.mockResolvedValue('content');

    await runCapture('frontend', 2);

    const expectedPath = join(process.cwd(), '.solo', 'capture', 'frontend-2.md');
    expect(mockWriteFileSync).toHaveBeenCalledWith(expectedPath, 'content');
  });

  it('写入路径包含正确的 agent 名称与 pane 索引', async () => {
    mockGetAgent.mockReturnValue({ name: 'api', workspace: '/srv', activate: true });
    mockStatSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockCapturePane.mockResolvedValue('content');

    await runCapture('api', 0);

    const expectedPath = join(process.cwd(), '.solo', 'capture', 'api-0.md');
    expect(mockWriteFileSync).toHaveBeenCalledWith(expectedPath, 'content');
  });
});
