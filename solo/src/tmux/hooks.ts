import { exec } from '../process';

/**
 * tmux 3.6b 支持的全部 hook 名（单一数据源，TmuxHook 类型由此派生）
 *
 * 分类：
 * - after-*：命令执行后触发的钩子（38 个）
 * - alert-*：告警类钩子（3 个）
 * - client-*：客户端连接相关（9 个）
 * - command-*：命令错误（1 个）
 * - session-*：会话生命周期（4 个）
 * - window-*：窗口链接状态（2 个）
 */
export const HOOK_NAMES = [
  // after-* 系列（38 个）
  'after-bind-key',
  'after-capture-pane',
  'after-copy-mode',
  'after-display-message',
  'after-display-panes',
  'after-kill-pane',
  'after-list-buffers',
  'after-list-clients',
  'after-list-keys',
  'after-list-panes',
  'after-list-sessions',
  'after-list-windows',
  'after-load-buffer',
  'after-lock-server',
  'after-new-session',
  'after-new-window',
  'after-paste-buffer',
  'after-pipe-pane',
  'after-queue',
  'after-refresh-client',
  'after-rename-session',
  'after-rename-window',
  'after-resize-pane',
  'after-resize-window',
  'after-save-buffer',
  'after-select-layout',
  'after-select-pane',
  'after-select-window',
  'after-send-keys',
  'after-set-buffer',
  'after-set-environment',
  'after-set-hook',
  'after-set-option',
  'after-show-environment',
  'after-show-messages',
  'after-show-options',
  'after-split-window',
  'after-unbind-key',
  // alert 系列（3 个）
  'alert-activity',
  'alert-bell',
  'alert-silence',
  // client 系列（9 个）
  'client-active',
  'client-attached',
  'client-detached',
  'client-focus-in',
  'client-focus-out',
  'client-resized',
  'client-session-changed',
  'client-light-theme',
  'client-dark-theme',
  // command（1 个）
  'command-error',
  // session 系列（4 个）
  'session-closed',
  'session-created',
  'session-renamed',
  'session-window-changed',
  // window 系列（2 个）
  'window-linked',
  'window-unlinked'
] as const;

/**
 * tmux hook 名称类型（由 HOOK_NAMES 派生）
 */
export type TmuxHook = (typeof HOOK_NAMES)[number];

/**
 * 运行时守卫：字符串是否为合法的 tmux hook 名
 * @param name 待校验的 hook 名
 * @returns 是合法 hook 名返回 true
 */
export const isTmuxHook = (name: string): name is TmuxHook => {
  return (HOOK_NAMES as readonly string[]).includes(name);
};

/**
 * 构建 scope 选项参数
 * @param session 指定 session 名；undefined 则全局
 */
const scopeArg = (session?: string): string => (session ? `-t ${session}` : '-g');

/**
 * 设置 hook
 * @param hook hook 名称
 * @param command 要执行的 shell 命令
 * @param session 指定 session；省略则全局生效
 */
export const setHook = async (hook: TmuxHook, command: string, session?: string): Promise<void> => {
  const scope = scopeArg(session);
  await exec.fn(`tmux set-hook ${scope} ${hook} '${command}'`);
};

/**
 * 移除 hook
 * @param hook hook 名称
 * @param session 指定 session；省略则全局移除
 */
export const unsetHook = async (hook: TmuxHook, session?: string): Promise<void> => {
  const scope = scopeArg(session);
  await exec.fn(`tmux set-hook ${scope} -u ${hook}`);
};

/**
 * 查看 hook 绑定的命令
 * @param hook hook 名称
 * @param session 指定 session；省略则查看全局
 * @returns hook 绑定内容（stdout 原文）
 */
export const showHook = async (hook: TmuxHook, session?: string): Promise<string> => {
  const scope = scopeArg(session);
  const { stdout } = await exec.fn(`tmux show-hooks ${scope} ${hook}`);
  return stdout;
};

/**
 * 事件回调命令模板：tmux 触发事件时调用 solo hook 上报事件上下文
 * @param hookName 事件名称
 */
const buildRunShellCommand = (hookName: string): string =>
  `run-shell "solo hook --name=${hookName} --session_name=#{session_name} --window_name=#{window_name} --pane_index=#{pane_index}"`;

/**
 * 按配置在 session 中注册启用的事件回调
 * 仅注册值为 true 的事件；未知事件名（tmux 不支持）直接抛错终止
 * @param sessionName 目标 session 名
 * @param hooks 配置 hooks 段（事件名 → 是否启用）
 * @returns 已注册的事件名列表
 */
export const registerHooks = async (sessionName: string, hooks?: Record<string, boolean>): Promise<string[]> => {
  const registered: string[] = [];
  for (const [event, enabled] of Object.entries(hooks ?? {})) {
    if (!enabled) continue;
    if (!isTmuxHook(event)) {
      throw new Error(`hooks 配置包含未知事件 "${event}"（tmux 不支持该事件名），请修正 .solo/config 的 hooks 段`);
    }
    await setHook(event, buildRunShellCommand(event), sessionName);
    registered.push(event);
  }
  return registered;
};
