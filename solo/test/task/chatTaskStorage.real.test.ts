import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

import {
  registerTask,
  updateTaskState,
  getTask,
  listTasks,
  getTerminalCounts,
  resetTaskStore
} from '../../src/task/chatTaskStorage';
import type { TmuxTask } from '../../src/task';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-10T10:00:00Z'));
  resetTaskStore();
});

afterEach(() => {
  vi.useRealTimers();
});

/** 推进 1 秒以确保 formatUtcCompact 生成不同 ID */
const tick = () => {
  vi.advanceTimersByTime(1000);
};

// ============ 原 chatTaskStorage 测试 ============

describe('registerTask（daemon 路径）', () => {
  it('注册任务返回 ID，初始状态为 pending', () => {
    const id = registerTask({ type: 'tmux' });
    expect(id).toMatch(/^task-/);
  });
});

describe('updateTaskState', () => {
  it('更新任务状态到终态后任务从 taskStore 移除，计数累加', () => {
    const id = registerTask({ type: 'shell' });
    updateTaskState(id, 'running');
    updateTaskState(id, 'completed');
    expect(getTerminalCounts().completed).toBe(1);
    expect(listTasks()).toEqual([]);
  });

  it('任务不存在时静默忽略', () => {
    expect(() => updateTaskState('nonexistent', 'running')).not.toThrow();
  });
});

// ============ 原 manager 测试（迁移） ============

describe('registerTask（CLI 路径）', () => {
  it('返回以时间戳为基础的任务 ID 并存储到内存', () => {
    const taskId = registerTask({ agentName: 'frontend', session: 'sess', window: 'win', paneIndex: 0 });
    expect(taskId).toBe('task-20260910T100000');
    const stored = getTask(taskId) as TmuxTask;
    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({
      id: 'task-20260910T100000',
      name: 'frontend',
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
    const result = getTask(taskId)!;
    expect(result.id).toBe(taskId);
    expect(result.status).toBe('pending');
  });

  it('任务不存在时返回 null', () => {
    expect(getTask('nonexistent')).toBeNull();
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

describe('updateTaskState 终态计数', () => {
  it('状态变为 completed 时计数加 1 并从 taskStore 移除', () => {
    const taskId = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    updateTaskState(taskId, 'completed');
    expect(getTerminalCounts()).toEqual({ completed: 1, timeout: 0, failed: 0, killed: 0 });
    expect(listTasks()).toEqual([]);
  });

  it('状态变为 timeout 时计数加 1 并从 taskStore 移除', () => {
    const taskId = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    updateTaskState(taskId, 'timeout');
    expect(getTerminalCounts()).toEqual({ completed: 0, timeout: 1, failed: 0, killed: 0 });
    expect(listTasks()).toEqual([]);
  });

  it('状态变为 failed 时计数加 1 并从 taskStore 移除', () => {
    const taskId = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    updateTaskState(taskId, 'failed');
    expect(getTerminalCounts()).toEqual({ completed: 0, timeout: 0, failed: 1, killed: 0 });
    expect(listTasks()).toEqual([]);
  });

  it('状态变为 killed 时计数加 1 并从 taskStore 移除', () => {
    const taskId = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    updateTaskState(taskId, 'killed');
    expect(getTerminalCounts()).toEqual({ completed: 0, timeout: 0, failed: 0, killed: 1 });
    expect(listTasks()).toEqual([]);
  });

  it('非终态更新（pending/running）不影响计数，任务保留在 taskStore', () => {
    const taskId = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    updateTaskState(taskId, 'running');
    expect(getTerminalCounts()).toEqual({ completed: 0, timeout: 0, failed: 0, killed: 0 });
    expect(listTasks()).toHaveLength(1);
  });

  it('多次终态更新累加计数', () => {
    const id1 = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    tick();
    const id2 = registerTask({ session: 's', window: 'w', paneIndex: 1 });
    updateTaskState(id1, 'completed');
    updateTaskState(id2, 'failed');
    expect(getTerminalCounts()).toEqual({ completed: 1, timeout: 0, failed: 1, killed: 0 });
    expect(listTasks()).toEqual([]);
  });
});

describe('resetTaskStore 重置终态计数', () => {
  it('清空后终态计数归零', () => {
    const taskId = registerTask({ session: 's', window: 'w', paneIndex: 0 });
    updateTaskState(taskId, 'completed');
    expect(getTerminalCounts().completed).toBe(1);
    resetTaskStore();
    expect(getTerminalCounts()).toEqual({ completed: 0, timeout: 0, failed: 0, killed: 0 });
  });
});
