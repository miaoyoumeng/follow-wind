/** 任务状态：pending → running → completed | timeout */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'timeout' | 'failed' | 'killed';

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

/** tmux 后台任务记录，继承 Task 并扩展 tmux 特有字段 */
export interface TmuxTask extends Task {
  /** 关联的 tmux session（daemon 路径可缺省） */
  session?: string;
  /** 关联的 tmux window（daemon 路径可缺省） */
  window?: string;
  /** 关联的 pane 索引（daemon 路径可缺省） */
  paneIndex?: number;
}

/** 各状态的任务计数 */
export interface TaskStat {
  pending: number;
  running: number;
  completed: number;
  timeout: number;
  failed: number;
  killed: number;
}
