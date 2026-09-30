/**
 * Claude Hook 事件类型
 */
const CLAUDE_HOOK_EVENTS = [
  'SessionStart',
  'SessionEnd',
  'Stop',
  'StopFailure',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'PermissionRequest',
  'PermissionDenied'
] as const;
export type ClaudeHookEvent = (typeof CLAUDE_HOOK_EVENTS)[number];

/**
 * 事件处理器上下文
 */
export interface ProcessorContext {
  /** tmux session 名称（tmux 运行时存在） */
  session?: string;
  /** tmux window 名称（tmux 运行时存在） */
  window?: string;
  /** tmux pane 索引（tmux 运行时存在） */
  paneIndex?: number;
  /** stdin 解析后的完整数据 */
  stdinData: Record<string, unknown>;
  /** 工作目录 */
  workspace: string;
}

/**
 * 事件处理器接口
 */
export interface EventProcessor {
  /**
   * 处理事件
   * @param context 处理器上下文
   */
  process(context: ProcessorContext): Promise<void>;
}

/**
 * 判断是否为合法的 ClaudeHookEvent
 * @param event 事件名称
 * @returns 是否为合法的 ClaudeHookEvent
 */
export function isClaudeHookEvent(event: string): event is ClaudeHookEvent {
  return (CLAUDE_HOOK_EVENTS as readonly string[]).includes(event);
}
