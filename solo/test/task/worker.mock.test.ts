import { describe, it, expect, vi } from 'vitest';

const { mockRunPoll, mockInfo } = vi.hoisted(() => ({
  mockRunPoll: vi.fn().mockResolvedValue(undefined),
  mockInfo: vi.fn()
}));

vi.mock('../../src/task/polling', () => ({
  runPoll: mockRunPoll
}));

vi.mock(import('../../src/logging'), () => ({
  info: mockInfo,
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getLoggingConfig: vi.fn(),
  setup: vi.fn(),
  reset: vi.fn()
}));

import { runTaskWorker } from '../../src/task/worker';

describe('runTaskWorker', () => {
  it('调用 runPoll 并传入所有参数', async () => {
    await runTaskWorker('task-001', 'sess', 'win', 0, 'frontend');

    expect(mockRunPoll).toHaveBeenCalledWith('task-001', 'sess', 'win', 0, 'frontend');
  });

  it('worker 启动时输出启动日志', async () => {
    await runTaskWorker('task-002', 'sess', 'win', 1);

    expect(mockInfo).toHaveBeenCalledWith('[task:task-002] worker started');
  });

  it('agentName 为 undefined 时正确传递', async () => {
    await runTaskWorker('task-003', 'sess', 'win', 2);

    expect(mockRunPoll).toHaveBeenCalledWith('task-003', 'sess', 'win', 2, undefined);
  });
});
