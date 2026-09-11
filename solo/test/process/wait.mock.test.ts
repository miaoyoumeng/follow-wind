import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRegisterTask, mockSpawn } = vi.hoisted(() => ({
  mockRegisterTask: vi.fn().mockReturnValue('task-001'),
  mockSpawn: vi.fn().mockReturnValue({ pid: 12345, unref: vi.fn() })
}));

vi.mock('../../src/task', () => ({
  registerTask: mockRegisterTask
}));

vi.mock('child_process', () => ({
  spawn: mockSpawn,
  exec: vi.fn()
}));

vi.mock(import('../../src/logging'), () => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getLoggingConfig: vi.fn(),
  setup: vi.fn(),
  reset: vi.fn()
}));

import { waitForIdle } from '../../src/process/wait';

describe('waitForIdle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('注册任务并启动后台 worker，立即返回', () => {
    const result = waitForIdle('sess', 'win', 0, 'frontend');

    expect(mockRegisterTask).toHaveBeenCalledWith({
      agentName: 'frontend',
      session: 'sess',
      window: 'win',
      paneIndex: 0
    });
    expect(mockSpawn).toHaveBeenCalledTimes(1);
    const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
    expect(spawnArgs).toContain('_task-worker');
    expect(spawnArgs).toContain('task-001');
    expect(spawnArgs).toContain('frontend');
    expect(result.id).toBe('task-001');
    expect(result.pid).toBe(12345);
  });

  it('worker 进程以 detached 模式启动', () => {
    waitForIdle('sess', 'win', 0, 'frontend');

    const options = mockSpawn.mock.calls[0][2] as Record<string, unknown>;
    expect(options.detached).toBe(true);
    expect(options.stdio).toBe('ignore');
  });

  it('agentName 为 undefined 时正确传递', () => {
    waitForIdle('sess', 'win', 2);

    expect(mockRegisterTask).toHaveBeenCalledWith({
      agentName: undefined,
      session: 'sess',
      window: 'win',
      paneIndex: 2
    });
    const spawnArgs = mockSpawn.mock.calls[0][1] as string[];
    // agentName 为 undefined 时不应追加到参数列表
    expect(spawnArgs.filter(a => a === 'frontend')).toHaveLength(0);
  });
});
