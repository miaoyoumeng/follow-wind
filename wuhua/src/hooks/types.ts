/** Hook 类型 */
type HookType = 'claude' | 'tmux';

/** Solo Hook 基础结构 */
interface SoloHook {
  name: string;
  type: HookType;
  time: string;
  runner(): Promise<void>;
}

/** Tmux Hook */
export type TmuxHook = SoloHook;

/** Claude Hook，继承 SoloHook，携带工作区路径 */
export interface ClaudeHook extends SoloHook {
  workspace: string;
}
