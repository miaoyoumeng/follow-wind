/** Hook 类型 */
type HookType = 'claude' | 'tmux';

/** Wuhua Hook 基础结构 */
interface WuhuaHook {
  name: string;
  type: HookType;
  time: string;
  runner(): Promise<void>;
}

/** Tmux Hook */
export type TmuxHook = WuhuaHook;

/** Claude Hook，继承 WuhuaHook，携带工作区路径 */
export interface ClaudeHook extends WuhuaHook {
  workspace: string;
}
