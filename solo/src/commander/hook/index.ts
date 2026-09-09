import { Command } from 'commander';
import { isTmuxHook } from '../../tmux';
import type { HookCallbackParams } from './types';

export type { HookCallbackParams } from './types';

/**
 * 处理 tmux hook 回调：校验事件名合法性，打印回调参数
 * @param params tmux 回调参数
 */
export const runHook = (params: HookCallbackParams): void => {
  if (!isTmuxHook(params.name)) {
    throw new Error(`未知 hook 事件 "${params.name}"（不在 tmux hook 池中）`);
  }
  console.log(`[hook] ${params.name} | session=${params.sessionName} window=${params.windowName} pane=${params.paneIndex}(${params.paneId})`);
};

/**
 * 注册 solo hook 子命令（tmux hook 回调入口）
 * @param program commander 实例
 */
export const registerHookCommand = (program: Command): void => {
  program
    .command('hook')
    .description('tmux hook 回调入口（由 tmux run-shell 自动调用）')
    .requiredOption('--name <name>', 'hook 事件名')
    .requiredOption('--session_name <session_name>', 'session 名称')
    .requiredOption('--window_name <window_name>', 'window 名称')
    .requiredOption('--pane_index <pane_index>', 'pane 索引')
    .requiredOption('--pane_id <pane_id>', 'pane ID')
    .action((opts: Record<string, string>) => {
      runHook({
        name: opts.name,
        sessionName: opts.session_name,
        windowName: opts.window_name,
        paneIndex: opts.pane_index,
        paneId: opts.pane_id
      });
    });
};
