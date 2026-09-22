import { formatUtcCompact } from '../utils';
import { logger } from '../logging';
import type { TaskConfig } from '../config';
import type { Task, TaskStatus, TaskType } from './types';

// 内存任务存储
const taskStore = new Map<string, Task>();

// 任务配置：coreSize 默认 32，maxSize 无默认（从配置读取）
const DEFAULT_CORE_SIZE = 32;
let taskConfig: { coreSize: number; maxSize?: number } = { coreSize: DEFAULT_CORE_SIZE };

/**
 * 初始化任务管理器：读取配置并用 debug 日志打印
 * @param config 任务配置：coreSize 和 maxSize
 */
export const initTaskManager = (config: TaskConfig): void => {
  taskConfig = {
    coreSize: config.coreSize ?? DEFAULT_CORE_SIZE,
    maxSize: config.maxSize
  };
  logger.debug(
    `[task-manager] 初始化配置: coreSize=${taskConfig.coreSize}, maxSize=${taskConfig.maxSize ?? 'undefined'}`
  );
};

/**
 * 获取当前任务配置
 */
export const getTaskConfig = (): { coreSize: number; maxSize?: number } => {
  return { ...taskConfig };
};

/**
 * 注册新任务，返回任务 ID
 * @param params 任务参数：CLI 路径提供 agentName/session/window/paneIndex，daemon 路径提供 type/pid
 */
export const registerTask = (params: {
  type?: TaskType;
  pid?: number;
  agentName?: string;
  session?: string;
  window?: string;
  paneIndex?: number;
}): string => {
  const id = `task-${formatUtcCompact()}`;
  const task: Task = {
    id,
    type: params.type ?? 'local_bash',
    pid: params.pid ?? 0,
    agentName: params.agentName,
    status: 'pending',
    session: params.session ?? '',
    window: params.window ?? '',
    paneIndex: params.paneIndex ?? 0,
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
 * 更新任务状态（便捷方法）
 * @param taskId 任务 ID
 * @param status 新状态
 */
export const updateTaskState = (taskId: string, status: TaskStatus): void => {
  updateTask(taskId, {
    status,
    completedAt:
      status === 'completed' || status === 'failed' || status === 'killed' ? new Date().toISOString() : undefined
  });
};

/**
 * 获取所有 running 状态的任务
 */
export const getRunningTasks = (): Task[] => {
  return Array.from(taskStore.values()).filter(t => t.status === 'running');
};

/**
 * 驱逐任务（从存储中移除）
 * @param taskId 任务 ID
 * @returns true 表示成功驱逐，false 表示任务不存在
 */
export const evictTask = (taskId: string): boolean => {
  return taskStore.delete(taskId);
};

/**
 * 清空所有任务（用于测试或重置）
 */
export const clearTaskStorage = (): void => {
  taskStore.clear();
};

/** 清空所有任务（clearTaskStorage 的别名） */
export const clearTasks = clearTaskStorage;
