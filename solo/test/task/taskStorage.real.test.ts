import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/logging', () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getLoggingConfig: vi.fn(),
  setup: vi.fn(),
  reset: vi.fn()
}));

import {
  registerTask,
  updateTaskState,
  getRunningTasks,
  evictTask,
  statTask,
  clearTaskStorage,
  getTask,
  listTasks,
  updateTask,
  getTaskSummary,
  initTaskManager,
  getTaskConfig,
  clearTasks
} from '../../src/task/taskStorage';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-10T10:00:00Z'));
  clearTaskStorage();
});

afterEach(() => {
  vi.useRealTimers();
});

/** 推进 1 秒以确保 formatUtcCompact 生成不同 ID */
const tick = () => { vi.advanceTimersByTime(1000); };

// ============ 原 taskStorage 测试 ============

describe('registerTask（daemon 路径）', () => {
  it('注册任务返回 ID，初始状态为 pending', () => {
    const id = registerTask({ type: 'local_bash' });
    expect(id).toMatch(/^task-/);
  });

  it('注册时可指定 pid', () => {
    const id = registerTask({ type: 'local_agent', pid: 1234 });
    expect(getRunningTasks()).toHaveLength(0);
    updateTaskState(id, 'running');
    expect(getRunningTasks()).toHaveLength(1);
    expect(getRunningTasks()[0].pid).toBe(1234);
  });
});

describe('updateTaskState', () => {
  it('更新任务状态', () => {
    const id = registerTask({ type: 'dream' });
    updateTaskState(id, 'running');
    updateTaskState(id, 'completed');
    const stat = statTask();
    expect(stat.completed).toBe(1);
    expect(stat.pending).toBe(0);
    expect(stat.running).toBe(0);
  });

  it('任务不存在时抛错', () => {
    expect(() => updateTaskState('nonexistent', 'running')).toThrow(/not found/i);
  });
});

describe('getRunningTasks', () => {
  it('返回所有 running 状态的任务', () => {
    const id1 = registerTask({ type: 'local_bash' });
    tick();
    const id2 = registerTask({ type: 'local_agent' });
    tick();
    registerTask({ type: 'dream' });
    updateTaskState(id1, 'running');
    updateTaskState(id2, 'running');
    const running = getRunningTasks();
    expect(running).toHaveLength(2);
    expect(running.every(t => t.status === 'running')).toBe(true);
  });

  it('无 running 任务时返回空数组', () => {
    registerTask({ type: 'local_bash' });
    expect(getRunningTasks()).toHaveLength(0);
  });
});

describe('evictTask', () => {
  it('驱逐存在的任务返回 true', () => {
    const id = registerTask({ type: 'local_bash' });
    expect(evictTask(id)).toBe(true);
    expect(statTask().pending).toBe(0);
  });

  it('驱逐不存在的任务返回 false', () => {
    expect(evictTask('nonexistent')).toBe(false);
  });
});

describe('statTask', () => {
  it('统计各状态的任务数量', () => {
    const id1 = registerTask({ type: 'local_bash' });
    tick();
    const id2 = registerTask({ type: 'local_agent' });
    tick();
    const id3 = registerTask({ type: 'dream' });
    tick();
    const id4 = registerTask({ type: 'local_bash' });
    tick();
    const id5 = registerTask({ type: 'dream' });
    tick();
    registerTask({ type: 'local_agent' });
    updateTaskState(id1, 'running');
    updateTaskState(id2, 'completed');
    updateTaskState(id3, 'timeout');
    updateTaskState(id4, 'failed');
    updateTaskState(id5, 'killed');
    const stat = statTask();
    expect(stat).toEqual({
      pending: 1,
      running: 1,
      completed: 1,
      timeout: 1,
      failed: 1,
      killed: 1
    });
  });

  it('无任务时返回全零', () => {
    expect(statTask()).toEqual({
      pending: 0,
      running: 0,
      completed: 0,
      timeout: 0,
      failed: 0,
      killed: 0
    });
  });
});

// ============ 原 manager 测试（迁移） ============

describe('registerTask（CLI 路径）', () => {
  it('返回以时间戳为基础的任务 ID 并存储到内存', () => {
    const taskId = registerTask({ agentName: 'frontend', session: 'sess', window: 'win', paneIndex: 0 });
    expect(taskId).toBe('task-20260910T100000');
    const stored = getTask(taskId);
    expect(stored).toMatchObject({
      id: 'task-20260910T100000',
      agentName: 'frontend',
      status: 'pending',
      session: 'sess',
      window: 'win',
      paneIndex: 0
    });
    expect(stored.createdAt).toBeDefined();
  });
});

describe('getTask', () => {
  it('从内存读取并返回指定任务', () => {
    const taskId = registerTask({ session: 'sess', window: 'win', paneIndex: 0 });
    const result = getTask(taskId);
    expect(result.id).toBe(taskId);
    expect(result.status).toBe('pending');
  });

  it('任务不存在时抛出错误', () => {
    expect(() => getTask('nonexistent')).toThrow();
  });
});

describe('listTasks', () => {
  it('返回内存中所有任务', () => {
    registerTask({ session: 's1', window: 'w1', paneIndex: 0 });
    tick();
    registerTask({ session: 's2', window: 'w2', paneIndex: 0 });
    expect(listTasks()).toHaveLength(2);
  });

  it('无任务时返回空数组', () => {
    expect(listTasks()).toEqual([]);
  });
});

describe('updateTask', () => {
  it('更新内存中任务的指定字段', () => {
    const taskId = registerTask({ session: 'sess', window: 'win', paneIndex: 0 });
    updateTask(taskId, { status: 'completed', pid: 99 });
    const updated = getTask(taskId);
    expect(updated.status).toBe('completed');
    expect(updated.pid).toBe(99);
  });
});

describe('getTaskSummary（= statTask）', () => {
  it('返回各状态的任务数量', () => {
    const t1 = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    tick();
    const t2 = registerTask({ session: 's', window: 'w', paneIndex: 1 });
    tick();
    const t3 = registerTask({ session: 's', window: 'w', paneIndex: 2 });
    tick();
    const t4 = registerTask({ session: 's', window: 'w', paneIndex: 3 });
    tick();
    const t5 = registerTask({ session: 's', window: 'w', paneIndex: 4 });

    updateTask(t1, { status: 'pending' });
    updateTask(t2, { status: 'running' });
    updateTask(t3, { status: 'completed' });
    updateTask(t4, { status: 'completed' });
    updateTask(t5, { status: 'timeout' });

    expect(getTaskSummary()).toEqual({ pending: 1, running: 1, completed: 2, timeout: 1, failed: 0, killed: 0 });
  });

  it('无任务时全部为 0', () => {
    expect(getTaskSummary()).toEqual({ pending: 0, running: 0, completed: 0, timeout: 0, failed: 0, killed: 0 });
  });
});

describe('clearTaskStorage / clearTasks', () => {
  it('清空所有任务', () => {
    registerTask({ session: 's', window: 'w', paneIndex: 0 });
    tick();
    registerTask({ session: 's', window: 'w', paneIndex: 1 });
    expect(listTasks()).toHaveLength(2);

    clearTaskStorage();
    expect(listTasks()).toEqual([]);
  });

  it('clearTasks 是 clearTaskStorage 的别名', () => {
    registerTask({ session: 's', window: 'w', paneIndex: 0 });
    clearTasks();
    expect(listTasks()).toEqual([]);
  });
});

describe('initTaskManager', () => {
  it('coreSize 未配置时使用默认值 32', () => {
    initTaskManager({ maxSize: 100 });
    expect(getTaskConfig().coreSize).toBe(32);
  });

  it('存储配置并可通过 getTaskConfig 获取', () => {
    initTaskManager({ coreSize: 50, maxSize: 100 });
    expect(getTaskConfig()).toEqual({ coreSize: 50, maxSize: 100 });
  });
});
