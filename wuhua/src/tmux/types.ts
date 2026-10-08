/**
 * hook 终端类型
 */
type HookEndpoint = 'tmux' | 'claude';

/**
 * hook 回调参数（由 hook 触发方传入）
 */
export interface HookCallbackParams {
  /** hook 终端类型 */
  readonly endpoint: HookEndpoint;
  /** hook 事件名 */
  readonly event: string;
  /** 工作目录（可选） */
  readonly workspace?: string;
}
