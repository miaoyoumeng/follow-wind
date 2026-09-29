import { formatUtcCompact, nowUTC } from '../utils/times';
import type { Task, TmuxTask, TaskStatus, TaskType } from './types';

// 内存任务存储
const taskStore = new Map<string, Task>();

// 终态任务计数（任务进入终态后从 taskStore 移除，计数累加）
let completed = 0;
let timeout = 0;
let failed = 0;
let killed = 0;

/** 终态状态集合 */
const TERMINAL_STATUSES: ReadonlySet<TaskStatus> = new Set(['completed', 'timeout', 'failed', 'killed']);

/**
 * 获取各终态任务的累计数量
 */
export const getTerminalCounts = (): { completed: number; timeout: number; failed: number; killed: number } => {
  return { completed, timeout, failed, killed };
};

/**
 * 注册新任务，返回任务 ID
 * @param params 任务参数：CLI 路径提供 agentName/session/window/paneIndex，daemon 路径提供 type
 */
export const registerTask = (params: {
  type?: TaskType;
  agentName?: string;
  session?: string;
  window?: string;
  paneIndex?: number;
}): string => {
  const id = `task-${formatUtcCompact()}`;
  const task: TmuxTask = {
    id,
    type: params.type ?? 'tmux',
    name: params.agentName,
    status: 'pending',
    session: params.session ?? '',
    window: params.window ?? '',
    paneIndex: params.paneIndex ?? 0,
    createdAt: nowUTC()
  };
  taskStore.set(id, task);
  return id;
};

/**
 * 读取指定任务的状态
 * @param taskId 任务 ID
 */
export const getTask = (taskId: string): Task | null => {
  const task = taskStore.get(taskId);
  if (!task) {
    return null;
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
 * 状态变为终态（completed/timeout/failed/killed）时，对应计数加 1 并从 taskStore 移除
 * @param taskId 任务 ID
 * @param updates 要更新的字段
 */
const updateTask = (taskId: string, updates: Partial<Pick<Task, 'status' | 'completedAt'>>): void => {
  const task = getTask(taskId);
  if (!task) {
    return;
  }
  const updated = { ...task, ...updates };
  if (updates.status && TERMINAL_STATUSES.has(updates.status)) {
    if (updates.status === 'completed') {
      completed++;
    } else if (updates.status === 'timeout') {
      timeout++;
    } else if (updates.status === 'failed') {
      failed++;
    } else if (updates.status === 'killed') {
      killed++;
    }
    taskStore.delete(taskId);
  } else {
    taskStore.set(taskId, updated);
  }
};

/**
 * 更新任务状态（便捷方法）
 * @param taskId 任务 ID
 * @param status 新状态
 */
export const updateTaskState = (taskId: string, status: TaskStatus): void => {
  updateTask(taskId, {
    status,
    completedAt: status === 'completed' || status === 'failed' || status === 'killed' ? nowUTC() : undefined
  });
};

/**
 * 清空所有任务并重置终态计数（用于测试或重置）
 */
export const resetTaskStore = (): void => {
  taskStore.clear();
  completed = 0;
  timeout = 0;
  failed = 0;
  killed = 0;
};
