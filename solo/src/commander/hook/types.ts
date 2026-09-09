/**
 * tmux hook 回调参数（由 tmux run-shell 传入）
 */
export interface HookCallbackParams {
  /** hook 事件名（必须是 tmux 支持的 hook 名） */
  readonly name: string;
  /** 触发事件的 session 名 */
  readonly sessionName: string;
  /** 触发事件的 window 名 */
  readonly windowName: string;
  /** 触发事件的 pane index */
  readonly paneIndex: string;
}
