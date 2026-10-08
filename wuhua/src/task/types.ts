/** 任务状态：pending → running → completed | timeout | failed */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'timeout' | 'failed';

/** 任务类型 */
export type TaskType = 'tmux' | 'claude' | 'shell';

/** 任务定义（策略）：描述一种任务的标识与终止行为 */
export type Task = {
  /** 唯一 ID */
  id: string;
  /** 任务名称 */
  name?: string;
  /** 任务类型 */
  type: TaskType;
  /** 任务状态 */
  status: TaskStatus;
  /** 任务创建时间（ISO 字符串） */
  createdAt: string;
  /** 任务结束时间（ISO 字符串） */
  completedAt?: string;
  /** 终止任务 */
  kill?(taskId: string, state: TaskStatus): Promise<void>;
};
