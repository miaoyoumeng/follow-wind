import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockValidateWorkspace, mockListTasks } = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockListTasks: vi.fn()
}));

vi.mock('../../../src/commander/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

vi.mock('../../../src/task', () => ({
  listTasks: mockListTasks
}));

import { runTasks } from '../../../src/commander/tasks';

describe('runTasks', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateWorkspace.mockReturnValue('test-session');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('无任务时输出空提示', async () => {
    mockListTasks.mockReturnValue([]);

    await runTasks();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('暂无任务'));
  });

  it('有任务时输出任务总数和每个任务信息', async () => {
    mockListTasks.mockReturnValue([
      { id: 'task-001', agentName: 'frontend', status: 'completed' as const, session: 'sess', window: 'win', paneIndex: 0, createdAt: '2026-01-01T00:00:00Z' },
      { id: 'task-002', agentName: 'backend', status: 'running' as const, session: 'sess', window: 'api', paneIndex: 1, createdAt: '2026-01-01T00:01:00Z' }
    ]);

    await runTasks();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('共 2 个任务'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('frontend'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('backend'));
  });

  it('工作区不合规时抛出错误', async () => {
    mockValidateWorkspace.mockImplementation(() => {
      throw new Error('workspace invalid');
    });

    await expect(runTasks()).rejects.toThrow('workspace invalid');
  });
});
