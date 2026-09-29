/** Hook 类型 */
type HookType = 'claude' | 'tmux';

/** Solo Hook 基础结构 */
interface SoloHook {
  name: string;
  type: HookType;
  time: string;
  runner(): Promise<void>;
}

/** Tmux Hook，继承 SoloHook，携带 tmux 定位信息（由 display-message 填充） */
export interface TmuxHook extends SoloHook {
  /** 当前 tmux session 名（runner 执行后由 display-message 填充） */
  sessionName: string;
  /** 当前 tmux window 名（runner 执行后由 display-message 填充） */
  windowName: string;
  /** 当前 pane 索引（runner 执行后由 display-message 填充） */
  paneIndex: string;
}

/** Claude Hook，继承 SoloHook，携带工作区路径 */
export interface ClaudeHook extends SoloHook {
  workspace: string;
}
