import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { SOLO_DIR } from '../config/paths';
import type { Task, TaskSummary } from './types';

export type { Task, TaskStatus, TaskSummary } from './types';

const TASKS_DIR = join(SOLO_DIR, 'tasks');

/**
 * 格式化当前时间为任务 ID 后缀（格式：YYYYMMDDTHHmmss，使用 UTC）
 */
const formatTaskTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
};

/**
 * 确保任务目录存在
 */
const ensureTasksDir = (): void => {
  if (!existsSync(TASKS_DIR)) {
    mkdirSync(TASKS_DIR, { recursive: true });
  }
};

/**
 * 返回任务文件路径
 * @param taskId 任务 ID
 */
const taskFilePath = (taskId: string): string => join(TASKS_DIR, `${taskId}.json`);

/**
 * 注册新任务：写入初始状态文件并返回任务 ID
 * @param params 任务参数
 */
export const registerTask = (params: { agentName?: string; session: string; window: string; paneIndex: number }): string => {
  const id = `task-${formatTaskTimestamp()}`;
  const task: Task = {
    id,
    agentName: params.agentName,
    status: 'pending',
    session: params.session,
    window: params.window,
    paneIndex: params.paneIndex,
    createdAt: new Date().toISOString()
  };
  ensureTasksDir();
  writeFileSync(taskFilePath(id), JSON.stringify(task, null, 2));
  return id;
};

/**
 * 读取指定任务的状态
 * @param taskId 任务 ID
 */
export const getTask = (taskId: string): Task => {
  const content = readFileSync(taskFilePath(taskId), 'utf-8');
  return JSON.parse(content) as Task;
};

/**
 * 列出所有任务（按文件名排序）
 */
export const listTasks = (): Task[] => {
  if (!existsSync(TASKS_DIR)) return [];
  return readdirSync(TASKS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(TASKS_DIR, f), 'utf-8')) as Task);
};

/**
 * 更新任务的指定字段（合并写入）
 * @param taskId 任务 ID
 * @param updates 要更新的字段
 */
export const updateTask = (taskId: string, updates: Partial<Pick<Task, 'status' | 'pid' | 'completedAt'>>): void => {
  const task = getTask(taskId);
  const updated = { ...task, ...updates };
  writeFileSync(taskFilePath(taskId), JSON.stringify(updated, null, 2));
};

/**
 * 统计各状态的任务数量
 */
export const getTaskSummary = (): TaskSummary => {
  const tasks = listTasks();
  const summary: TaskSummary = { pending: 0, running: 0, completed: 0, timeout: 0 };
  for (const task of tasks) {
    summary[task.status]++;
  }
  return summary;
};
