import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRunPoll, mockIpcUpdateTaskState } = vi.hoisted(() => ({
  mockRunPoll: vi.fn().mockResolvedValue(undefined),
  mockIpcUpdateTaskState: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../src/task/polling', () => ({
  runPoll: mockRunPoll
}));

vi.mock('../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown,
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

// worker 运行在独立子进程，通过 IPC 通知 daemon 更新状态，不直接调用本地 taskStorage
vi.mock('../../src/ipc', () => ({
  updateTaskState: mockIpcUpdateTaskState
}));

import { runTaskWorker } from '../../src/task';

describe('runTaskWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('调用 runPoll 并传入所有参数及 onStateChange 回调', async () => {
    await runTaskWorker('task-001', 'sess', 'win', 0, 'frontend');

    expect(mockRunPoll).toHaveBeenCalledWith('task-001', 'sess', 'win', 0, 'frontend', expect.any(Function));
  });

  it('agentName 为 undefined 时正确传递', async () => {
    await runTaskWorker('task-003', 'sess', 'win', 2);

    expect(mockRunPoll).toHaveBeenCalledWith('task-003', 'sess', 'win', 2, undefined, expect.any(Function));
  });

  it('onStateChange 回调通过 IPC 更新 daemon taskStorage 状态', async () => {
    await runTaskWorker('task-004', 'sess', 'win', 0, 'api');

    // 提取 runPoll 被调用时传入的 onStateChange 回调
    const onStateChange = mockRunPoll.mock.calls[0][5] as (taskId: string, status: string) => void;
    onStateChange('task-004', 'completed');

    expect(mockIpcUpdateTaskState).toHaveBeenCalledWith('task-004', 'completed');
  });

  it('worker 启动时通过 IPC 将任务状态设为 running', async () => {
    await runTaskWorker('task-005', 'sess', 'win', 0, 'api');

    expect(mockIpcUpdateTaskState).toHaveBeenCalledWith('task-005', 'running');
  });
});
