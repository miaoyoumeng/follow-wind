/** 任务状态：pending → running → completed | timeout */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'timeout' | 'failed' | 'killed';

/** 任务类型 */
export type TaskType = 'local_bash' | 'local_agent' | 'dream';

/** 后台任务记录 */
export interface Task {
  /** 唯一 ID（格式：task-YYYYMMDDTHHmmss） */
  id: string;
  /** agent 名称（可选） */
  agentName?: string;
  /** 任务状态 */
  status: TaskStatus;
  /** 任务类型 */
  type: TaskType;
  /** 后台 worker 进程 PID */
  pid?: number;
  /** 关联的 tmux session（daemon 路径可缺省） */
  session?: string;
  /** 关联的 tmux window（daemon 路径可缺省） */
  window?: string;
  /** 关联的 pane 索引（daemon 路径可缺省） */
  paneIndex?: number;
  /** 任务创建时间（ISO 字符串） */
  createdAt: string;
  /** 任务结束时间（ISO 字符串） */
  completedAt?: string;
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
