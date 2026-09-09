import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockExistsSync, mockMkdirSync, mockWriteFileSync, mockReadFileSync, mockReaddirSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockReaddirSync: vi.fn()
}));

// fs 是文件操作依赖，mock 以隔离磁盘读写
vi.mock('fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
  readFileSync: mockReadFileSync,
  readdirSync: mockReaddirSync
}));

import { registerTask, getTask, listTasks, updateTask, getTaskSummary } from '../../src/task/manager';

describe('task/manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('registerTask', () => {
    it('创建任务状态文件并返回以时间戳为基础的任务 ID', () => {
      const taskId = registerTask({ agentName: 'frontend', session: 'sess', window: 'win', paneIndex: 0 });

      expect(taskId).toBe('task-20260909T100000');
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const [filePath, content] = mockWriteFileSync.mock.calls[0];
      expect(filePath).toContain('task-20260909T100000.json');
      const parsed = JSON.parse(content as string);
      expect(parsed).toMatchObject({
        id: 'task-20260909T100000',
        agentName: 'frontend',
        status: 'pending',
        session: 'sess',
        window: 'win',
        paneIndex: 0
      });
      expect(parsed.createdAt).toBeDefined();
    });

    it('目录不存在时先创建', () => {
      mockExistsSync.mockReturnValue(false);
      registerTask({ agentName: 'frontend', session: 'sess', window: 'win', paneIndex: 0 });

      expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
  });

  describe('getTask', () => {
    it('读取并返回指定任务的状态', () => {
      const taskData = { id: 'task-001', agentName: 'frontend', status: 'completed', createdAt: 'now' };
      mockReadFileSync.mockReturnValue(JSON.stringify(taskData));

      const result = getTask('task-001');

      expect(result).toEqual(taskData);
      expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('task-001.json'), 'utf-8');
    });
  });

  describe('listTasks', () => {
    it('读取所有 .json 文件并返回任务数组', () => {
      mockReaddirSync.mockReturnValue(['task-001.json', 'task-002.json']);
      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify({ id: 'task-001', status: 'completed' }))
        .mockReturnValueOnce(JSON.stringify({ id: 'task-002', status: 'running' }));

      const result = listTasks();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task-001');
      expect(result[1].id).toBe('task-002');
    });

    it('目录不存在时返回空数组', () => {
      mockExistsSync.mockReturnValue(false);

      const result = listTasks();

      expect(result).toEqual([]);
    });
  });

  describe('updateTask', () => {
    it('将字段合并写入任务状态文件', () => {
      const original = { id: 'task-001', agentName: 'frontend', status: 'pending', createdAt: 'now' };
      mockReadFileSync.mockReturnValue(JSON.stringify(original));

      updateTask('task-001', { status: 'completed', pid: 99 });

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(written.status).toBe('completed');
      expect(written.pid).toBe(99);
      expect(written.id).toBe('task-001');
    });
  });

  describe('getTaskSummary', () => {
    it('返回各状态的任务数量', () => {
      mockReaddirSync.mockReturnValue(['t1.json', 't2.json', 't3.json', 't4.json', 't5.json']);
      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify({ id: 't1', status: 'pending' }))
        .mockReturnValueOnce(JSON.stringify({ id: 't2', status: 'running' }))
        .mockReturnValueOnce(JSON.stringify({ id: 't3', status: 'completed' }))
        .mockReturnValueOnce(JSON.stringify({ id: 't4', status: 'completed' }))
        .mockReturnValueOnce(JSON.stringify({ id: 't5', status: 'timeout' }));

      const result = getTaskSummary();

      expect(result).toEqual({ pending: 1, running: 1, completed: 2, timeout: 1 });
    });

    it('无任务时全部为 0', () => {
      mockExistsSync.mockReturnValue(false);

      const result = getTaskSummary();

      expect(result).toEqual({ pending: 0, running: 0, completed: 0, timeout: 0 });
    });
  });
});
