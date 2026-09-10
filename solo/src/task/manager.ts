import type { Task, TaskSummary } from './types';
import type { TaskConfig } from '../config';
import { debug } from '../logging';
import { formatUtcCompact } from '../utils';

export type { Task, TaskStatus, TaskSummary } from './types';

// 内存任务存储：key 为任务 ID，value 为 Task 对象
const taskStore = new Map<string, Task>();

// 任务配置：coreSize 默认 32，maxSize 无默认（从配置读取）
const DEFAULT_CORE_SIZE = 32;
let taskConfig: { coreSize: number; maxSize?: number } = { coreSize: DEFAULT_CORE_SIZE };

/**
 * 注册新任务：存储到内存并返回任务 ID
 * @param params 任务参数
 */
export const registerTask = (params: { agentName?: string; session: string; window: string; paneIndex: number }): string => {
  const id = `task-${formatUtcCompact()}`;
  const task: Task = {
    id,
    agentName: params.agentName,
    status: 'pending',
    session: params.session,
    window: params.window,
    paneIndex: params.paneIndex,
    createdAt: new Date().toISOString()
  };
  taskStore.set(id, task);
  return id;
};

/**
 * 读取指定任务的状态
 * @param taskId 任务 ID
 */
export const getTask = (taskId: string): Task => {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }
  return task;
};

/**
 * 列出所有任务（按插入顺序）
 */
export const listTasks = (): Task[] => {
  return Array.from(taskStore.values());
};

/**
 * 更新任务的指定字段（合并更新）
 * @param taskId 任务 ID
 * @param updates 要更新的字段
 */
export const updateTask = (taskId: string, updates: Partial<Pick<Task, 'status' | 'pid' | 'completedAt'>>): void => {
  const task = getTask(taskId);
  const updated = { ...task, ...updates };
  taskStore.set(taskId, updated);
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

/**
 * 清空所有任务（用于测试或重置）
 */
export const clearTasks = (): void => {
  taskStore.clear();
};

/**
 * 初始化任务管理器：读取配置并用 debug 日志打印
 * @param config 任务配置：coreSize 和 maxSize
 */
export const initTaskManager = (config: TaskConfig): void => {
  taskConfig = {
    coreSize: config.coreSize ?? DEFAULT_CORE_SIZE,
    maxSize: config.maxSize
  };
  debug(`[task-manager] 初始化配置: coreSize=${taskConfig.coreSize}, maxSize=${taskConfig.maxSize ?? 'undefined'}`);
};

/**
 * 获取当前任务配置（用于测试或调试）
 */
export const getTaskConfig = (): { coreSize: number; maxSize?: number } => {
  return { ...taskConfig };
};
