import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockDebug } = vi.hoisted(() => ({
  mockDebug: vi.fn()
}));

// logging 是日志输出依赖，mock 以隔离 task manager 的配置逻辑
vi.mock('../../src/logging', () => ({
  debug: mockDebug
}));

import {
  registerTask,
  getTask,
  listTasks,
  updateTask,
  getTaskSummary,
  clearTasks,
  initTaskManager,
  getTaskConfig
} from '../../src/task/manager';

describe('task/manager 内存管理', () => {
  beforeEach(() => {
    clearTasks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('registerTask', () => {
    it('返回以时间戳为基础的任务 ID 并存储到内存', () => {
      const taskId = registerTask({ agentName: 'frontend', session: 'sess', window: 'win', paneIndex: 0 });

      expect(taskId).toBe('task-20260909T100000');
      const stored = getTask(taskId);
      expect(stored).toMatchObject({
        id: 'task-20260909T100000',
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
      vi.advanceTimersByTime(1000); // 推进 1 秒确保 ID 不同
      registerTask({ session: 's2', window: 'w2', paneIndex: 0 });

      const result = listTasks();
      expect(result).toHaveLength(2);
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

  describe('getTaskSummary', () => {
    it('返回各状态的任务数量', () => {
      const t1 = registerTask({ session: 's', window: 'w', paneIndex: 0 });
      vi.advanceTimersByTime(1000);
      const t2 = registerTask({ session: 's', window: 'w', paneIndex: 1 });
      vi.advanceTimersByTime(1000);
      const t3 = registerTask({ session: 's', window: 'w', paneIndex: 2 });
      vi.advanceTimersByTime(1000);
      const t4 = registerTask({ session: 's', window: 'w', paneIndex: 3 });
      vi.advanceTimersByTime(1000);
      const t5 = registerTask({ session: 's', window: 'w', paneIndex: 4 });

      updateTask(t1, { status: 'pending' });
      updateTask(t2, { status: 'running' });
      updateTask(t3, { status: 'completed' });
      updateTask(t4, { status: 'completed' });
      updateTask(t5, { status: 'timeout' });

      const result = getTaskSummary();
      expect(result).toEqual({ pending: 1, running: 1, completed: 2, timeout: 1 });
    });

    it('无任务时全部为 0', () => {
      expect(getTaskSummary()).toEqual({ pending: 0, running: 0, completed: 0, timeout: 0 });
    });
  });

  describe('clearTasks', () => {
    it('清空所有任务', () => {
      registerTask({ session: 's', window: 'w', paneIndex: 0 });
      vi.advanceTimersByTime(1000);
      registerTask({ session: 's', window: 'w', paneIndex: 1 });
      expect(listTasks()).toHaveLength(2);

      clearTasks();
      expect(listTasks()).toEqual([]);
    });
  });

  describe('initTaskManager', () => {
    beforeEach(() => {
      mockDebug.mockClear();
    });

    it('读取配置并用 debug 日志打印 coreSize 和 maxSize', () => {
      initTaskManager({ coreSize: 50, maxSize: 100 });

      expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('coreSize'));
      expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('50'));
      expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('maxSize'));
      expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('100'));
    });

    it('coreSize 未配置时使用默认值 32', () => {
      initTaskManager({ maxSize: 100 });
      const config = getTaskConfig();
      expect(config.coreSize).toBe(32);
    });

    it('存储配置并可通过 getTaskConfig 获取', () => {
      initTaskManager({ coreSize: 50, maxSize: 100 });
      const config = getTaskConfig();
      expect(config).toEqual({ coreSize: 50, maxSize: 100 });
    });
  });
});
