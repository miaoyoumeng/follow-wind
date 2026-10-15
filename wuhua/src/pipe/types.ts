/**
 * 命令行指令
 */
export interface Instruct {
  /** 要执行的内容 */
  prompt: string;
  /** 创建时间（UTC，ISO 8601 格式） */
  createdAt: string;
  /** 已失败重试次数（缺省视为 0） */
  retryCount?: number;
}

/**
 * pane 状态取值，粒度是 pane（router），即 claude 所在的那个 pane。
 * 三值的提交语义不同：
 * - idle：空闲，可提交
 * - running：有任务在跑，提交被拒（busy）
 * - error：上一轮以 Claude StopFailure 结束，允许新任务覆盖提交
 */
export type PaneStatusValue = 'idle' | 'running' | 'error';

/** 等待 Claude Stop 的结算结果：completed 收到 Stop；timeout 超时；aborted 客户端断开 */
export type WaitOutcome = 'completed' | 'timeout' | 'aborted';

/** 独占执行 prompt 的结果 */
export type PromptRunOutcome = 'completed' | 'busy' | 'no-router' | 'timeout' | 'aborted';

/** 挂起的等待项 */
export interface PendingWait {
  /** 结算该等待项 */
  resolve: (outcome: WaitOutcome) => void;
  /** 超时定时器 */
  timer: NodeJS.Timeout;
}

/** 指令分发结果 */
export interface DispatchResult {
  /** 指令是否已入队并触发 roller */
  dispatched: boolean;
  /** 未分发的原因：busy 被 wuhua prompt 独占；no-router 该 pane 未注册 */
  reason?: 'busy' | 'no-router';
}

/** pane 状态：绑定 tmux 坐标，随任务流转 */
export interface PaneStatus {
  /** tmux session 名称 */
  readonly session: string;
  /** tmux window 名称 */
  readonly window: string;
  /** tmux pane 索引 */
  readonly paneIndex: number;
  /** 当前状态 */
  status: PaneStatusValue;
}

/** 独占执行 prompt 的运行时选项 */
export interface PromptRunOptions {
  /** 注册「连接关闭」监听，用于客户端断开时中止等待 */
  onConnectionClose?: (listener: () => void) => void;
}
