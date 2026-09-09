import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';

const { mockCompareWithStored, mockInfo, mockDebug, mockReadConfig, mockUpdateTask, mockCapturePane, mockWriteFileSync, mockMkdirSync } = vi.hoisted(() => ({
  mockCompareWithStored: vi.fn(),
  mockInfo: vi.fn(),
  mockDebug: vi.fn(),
  mockReadConfig: vi.fn(),
  mockUpdateTask: vi.fn(),
  mockCapturePane: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockMkdirSync: vi.fn()
}));

vi.mock('../../src/core/comparison', () => ({
  compareWithStored: mockCompareWithStored
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

vi.mock('../../src/core/yaml', () => ({
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

vi.mock('fs', () => ({
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  readFileSync: vi.fn(),
  appendFileSync: vi.fn()
}));

import { runPoll } from '../../src/task/polling';

describe('runPoll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockReadConfig.mockReturnValue({});
    mockCapturePane.mockResolvedValue('pane-content');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('每次轮询都传入 saveOnChange=true，稳定后标记 completed', async () => {
    mockCompareWithStored.mockResolvedValueOnce({ changed: true }).mockResolvedValue({ changed: false });

    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.runAllTimersAsync();
    await promise;

    expect(mockCompareWithStored).toHaveBeenCalledTimes(2);
    // 关键：每次调用 saveOnChange 参数都应为 true（而非仅第一次）
    expect(mockCompareWithStored.mock.calls[0][4]).toBe(true);
    expect(mockCompareWithStored.mock.calls[1][4]).toBe(true);
    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: 'completed', completedAt: expect.any(String) });
    expect(mockInfo).toHaveBeenCalledTimes(1);
    expect(mockInfo.mock.calls[0][0]).toContain('idle');
    expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('compare #1'));
    expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('compare #2'));
  });

  it('每次轮询保存 debug 快照到 CAPTURE_DIR，文件名为 agentName-paneIndex.md', async () => {
    mockCompareWithStored.mockResolvedValueOnce({ changed: true }).mockResolvedValue({ changed: false });

    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.runAllTimersAsync();
    await promise;

    // 每次轮询都调用了 capturePane 用于 debug 快照
    expect(mockCapturePane).toHaveBeenCalledTimes(2);
    // CAPTURE_DIR 被创建
    expect(mockMkdirSync).toHaveBeenCalledWith('/tmp/solo-test-polling', { recursive: true });
    // 文件名格式：agentName-paneIndex.md
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/frontend-0\.md$/),
      'pane-content'
    );
  });

  it('debug 日志包含截图时间戳', async () => {
    mockCompareWithStored.mockResolvedValueOnce({ changed: true }).mockResolvedValue({ changed: false });

    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.runAllTimersAsync();
    await promise;

    expect(mockDebug).toHaveBeenCalledWith(expect.stringMatching(/screenshot #1.*\d{8}-\d{6}/));
    expect(mockDebug).toHaveBeenCalledWith(expect.stringMatching(/screenshot #2.*\d{8}-\d{6}/));
  });

  it('内容持续变化直到超时，标记 timeout', async () => {
    mockReadConfig.mockReturnValue({ agents: { frontend: { workspace: '/app', waitTime: 1 } } });
    mockCompareWithStored.mockResolvedValue({ changed: true });

    const promise = runPoll('task-001', 'sess', 'win', 0, 'frontend');
    await vi.advanceTimersByTimeAsync(61_000);
    await promise;

    expect(mockUpdateTask).toHaveBeenCalledWith('task-001', { status: 'timeout', completedAt: expect.any(String) });
    expect(mockInfo).toHaveBeenCalledTimes(1);
    expect(mockInfo.mock.calls[0][0]).toContain('timeout');
  });

  it('构造存储路径时使用 agentName', async () => {
    mockCompareWithStored.mockResolvedValueOnce({ changed: true }).mockResolvedValue({ changed: false });

    const promise = runPoll('task-001', 'sess', 'win', 2, 'api');
    await vi.runAllTimersAsync();
    await promise;

    const secondCall = mockCompareWithStored.mock.calls[1];
    expect(secondCall[3]).toContain('api-2.md');
  });

  it('无 agentName 时使用 session-window 作为路径前缀', async () => {
    mockCompareWithStored.mockResolvedValueOnce({ changed: true }).mockResolvedValue({ changed: false });

    const promise = runPoll('task-001', 'sess', 'win', 0);
    await vi.runAllTimersAsync();
    await promise;

    const secondCall = mockCompareWithStored.mock.calls[1];
    expect(secondCall[3]).toContain('sess-win-0.md');
  });
});
