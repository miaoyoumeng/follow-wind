import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';

const { mockInfo, mockDebug, mockReadConfig, mockUpdateTask, mockCapturePane, mockReadFile, mockWriteFile } = vi.hoisted(() => ({
  mockInfo: vi.fn(),
  mockDebug: vi.fn(),
  mockReadConfig: vi.fn(),
  mockUpdateTask: vi.fn(),
  mockCapturePane: vi.fn(),
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn()
}));

vi.mock(import('../../src/logging'), () => ({
  info: mockInfo,
  debug: mockDebug,
  warn: vi.fn(),
  error: vi.fn(),
  getLoggingConfig: vi.fn(),
  setup: vi.fn(),
  reset: vi.fn()
}));

vi.mock('../../src/config', () => ({
  readConfig: mockReadConfig
}));

vi.mock('../../src/task/manager', () => ({
  updateTask: mockUpdateTask
}));

vi.mock('../../src/tmux', () => ({
  capturePane: mockCapturePane
}));

vi.mock('../../src/config/paths', () => {
  const tmpDir = join('/tmp', 'solo-test-polling');
  return {
    CAPTURE_DIR: tmpDir
  };
});

vi.mock('../../src/utils', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile
}));

import { runPoll } from '../../src/task';

describe('runPoll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockReadConfig.mockReturnValue({});
    mockCapturePane.mockResolvedValue('pane-content');
    mockReadFile.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('每次轮询只调用一次 capturePane，readFile 仅在循环前调用一次', async () => {
    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.runAllTimersAsync();
    await promise;

    // 两次轮询，每次只调用一次 capturePane
    expect(mockCapturePane).toHaveBeenCalledTimes(2);
    // readFile 仅在循环前调用一次
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    // writeFile 每次轮询都调用（debug 快照 + 下次比较基线）
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: 'completed', completedAt: expect.any(String) });
  });

  it('内容持续变化直到超时，标记 timeout', async () => {
    mockReadConfig.mockReturnValue({ agents: { frontend: { workspace: '/app', waitTime: 1 } } });
    // 每次 capturePane 返回不同内容，使 storedContent（内存变量）始终与当前内容不同
    let callCount = 0;
    mockCapturePane.mockImplementation(() => Promise.resolve(`content-${++callCount}`));

    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.advanceTimersByTimeAsync(61_000);
    await promise;

    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: 'timeout', completedAt: expect.any(String) });
    expect(mockInfo).toHaveBeenCalledTimes(1);
    expect(mockInfo.mock.calls[0][0]).toContain('timeout');
  });

  it('无 agentName 时使用 session-window 作为路径前缀', async () => {
    const promise = runPoll('task-001', 'sess', 'win', 0);
    await vi.runAllTimersAsync();
    await promise;

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('sess-win-0.md'),
      'pane-content'
    );
  });

  it('构造存储路径时使用 agentName', async () => {
    const promise = runPoll('task-001', 'sess', 'win', 2, 'api');
    await vi.runAllTimersAsync();
    await promise;

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('api-2.md'),
      'pane-content'
    );
  });

  it('内容稳定后标记 completed 并输出 idle 日志', async () => {
    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.runAllTimersAsync();
    await promise;

    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: 'completed', completedAt: expect.any(String) });
    expect(mockInfo).toHaveBeenCalledTimes(1);
    expect(mockInfo.mock.calls[0][0]).toContain('idle');
  });
});
