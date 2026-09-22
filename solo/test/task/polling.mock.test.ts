import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';

const { mockDebug, mockReadConfig, mockUpdateTask, mockCapturePane, mockReadFile, mockWriteFile } = vi.hoisted(() => ({
  mockDebug: vi.fn(),
  mockReadConfig: vi.fn(),
  mockUpdateTask: vi.fn(),
  mockCapturePane: vi.fn(),
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn()
}));

vi.mock('../../src/logging', () => ({
  logger: {
    trace: vi.fn(),
    debug: mockDebug,
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    isTraceEnabled: vi.fn().mockReturnValue(false),
    isDebugEnabled: vi.fn().mockReturnValue(false),
    isInfoEnabled: vi.fn().mockReturnValue(false)
  } as unknown,
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

vi.mock('../../src/config', () => ({
  readConfig: mockReadConfig
}));

vi.mock('../../src/task/taskStorage', () => ({
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
    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', {
      status: 'completed',
      completedAt: expect.any(String) as unknown
    });
  });

  it('内容持续变化直到超时，标记 timeout', async () => {
    mockReadConfig.mockReturnValue({ agents: { frontend: { workspace: '/app', waitTime: 1 } } });
    // 每次 capturePane 返回不同内容，使 storedContent（内存变量）始终与当前内容不同
    let callCount = 0;
    mockCapturePane.mockImplementation(() => Promise.resolve(`content-${++callCount}`));

    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.advanceTimersByTimeAsync(61_000);
    await promise;

    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', {
      status: 'timeout',
      completedAt: expect.any(String) as unknown
    });
  });

  it('无 agentName 时使用 session-window 作为路径前缀', async () => {
    const promise = runPoll('task-001', 'sess', 'win', 0);
    await vi.runAllTimersAsync();
    await promise;

    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('sess-win-0.md'), 'pane-content');
  });

  it('构造存储路径时使用 agentName', async () => {
    const promise = runPoll('task-001', 'sess', 'win', 2, 'api');
    await vi.runAllTimersAsync();
    await promise;

    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('api-2.md'), 'pane-content');
  });

  it('内容稳定后标记 completed', async () => {
    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.runAllTimersAsync();
    await promise;

    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', {
      status: 'completed',
      completedAt: expect.any(String) as unknown
    });
  });

  it('提供 onStateChange 时，内容稳定后调用回调（completed）', async () => {
    const onStateChange = vi.fn();
    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend', onStateChange);
    await vi.runAllTimersAsync();
    await promise;

    expect(onStateChange).toHaveBeenCalledWith('task-001', 'completed');
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it('提供 onStateChange 时，超时后调用回调（timeout）', async () => {
    mockReadConfig.mockReturnValue({ agents: { frontend: { workspace: '/app', waitTime: 1 } } });
    let callCount = 0;
    mockCapturePane.mockImplementation(() => Promise.resolve(`content-${++callCount}`));
    const onStateChange = vi.fn();

    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend', onStateChange);
    await vi.advanceTimersByTimeAsync(61_000);
    await promise;

    expect(onStateChange).toHaveBeenCalledWith('task-001', 'timeout');
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });
});
