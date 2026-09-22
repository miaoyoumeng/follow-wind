#!/usr/bin/env node
import { Command } from 'commander';

import {
  runInit,
  runVersion,
  runStatus,
  runStart,
  runStop,
  runDashboard,
  runAgents,
  registerAgentCommand,
  runChat,
  runHook,
  runCapture,
  runUsage,
  type CommandSpec
} from '../commander';

import { getVersion } from '../utils';
import { setConfigPath } from '../config';
import { runTaskWorker } from '../task';
import { getLoggingConfig, logger, setup as setupLogger } from '../logging';

/** 从 .solo/config 读取日志配置并初始化日志模块（始终启用，缺失字段使用默认值） */
export const initLogger = (): void => {
  setupLogger(getLoggingConfig());
};

/**
 * 将命令表批量注册到 commander program
 * @param program commander 实例
 * @param specs 命令定义表
 */
export const registerCommands = (program: Command, specs: readonly CommandSpec[]): void => {
  for (const spec of specs) {
    const cmd = program.command(spec.name).description(spec.description);

    for (const arg of spec.args ?? []) {
      if (arg.parser) cmd.argument(arg.syntax, arg.description, arg.parser);
      else cmd.argument(arg.syntax, arg.description);
    }

    for (const opt of spec.options ?? []) {
      if (opt.isRequired) cmd.requiredOption(opt.flags, opt.description);
      else cmd.option(opt.flags, opt.description);
    }

    if (spec.allowExcessArguments === false) cmd.allowExcessArguments(false);

    cmd.action(async (...values: unknown[]) => {
      // CommandSpec.execute 声明为 (...args: never[]) 以兼容各命令各异的签名，此处收窄后调用
      await (spec.execute as (...args: unknown[]) => Promise<void> | void)(...values);
    });
  }
};

// 仅在直接执行时运行副作用（import 时跳过，使 solo.ts 可安全导入测试）
if (require.main === module) {
  initLogger();

  // 未捕获异常统一输出友好错误（不打印堆栈）
  process.on('unhandledRejection', (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    logger.error(`❌ ${message}`);
    process.exit(1);
  });
}

const program = new Command();

program
  .name('solo')
  .description('通过 tmux 管理多个 Claude 命令窗口')
  .version(getVersion())
  .option('--config <path>', '指定配置文件路径（默认 .solo/config.yaml）');

// 在执行任何子命令前，解析 --config 选项并更新配置路径
program.hook('preAction', (thisCommand: InstanceType<typeof Command>) => {
  const opts = thisCommand.opts<{ config?: string }>();
  if (opts.config) {
    setConfigPath(opts.config);
    setupLogger(getLoggingConfig());
  }
});

// agent 使用 [args...] + 手写参数解析（见 commander/agent/parse.ts），无法用命令表表达
registerAgentCommand(program);

/** 命令表：声明顺序即 --help 的列出顺序 */
const COMMANDS: readonly CommandSpec[] = [
  { name: 'init', description: '检查并初始化环境', execute: runInit },
  { name: 'version', description: '检查环境并显示版本', execute: runVersion },
  { name: 'status', description: '检查工作目录是否为合规的 solo 工作区', execute: runStatus },
  { name: 'start', description: '启动本项目的 tmux session', allowExcessArguments: false, execute: runStart },
  { name: 'stop', description: '终止本项目的 tmux session', execute: runStop },
  { name: 'dashboard', description: '进入本项目的 tmux session', execute: runDashboard },
  { name: 'agents', description: '显示 .solo/config 中的 agent 列表', execute: runAgents },
  {
    name: 'usage',
    description: '统计指定 agent 的 Claude token 消耗',
    args: [
      { syntax: '<agent-name>', description: 'agent 名称' },
      { syntax: '[date]', description: '统计日期 yyyy-mm-dd（默认今天）' }
    ],
    execute: runUsage
  },
  {
    name: 'chat',
    description: '向指定 agent 的 claude pane 发送消息',
    args: [
      { syntax: '<agent>', description: 'agent 名称' },
      { syntax: '<content>', description: '要发送的内容' }
    ],
    execute: runChat
  },
  {
    name: 'hook',
    description: 'tmux hook 回调入口（由 tmux run-shell 自动调用）',
    options: [
      { flags: '--name <name>', description: 'hook 事件名', isRequired: true },
      { flags: '--session_name <session_name>', description: 'session 名称', isRequired: true },
      { flags: '--window_name <window_name>', description: 'window 名称', isRequired: true },
      { flags: '--pane_index <pane_index>', description: 'pane 索引', isRequired: true }
    ],
    execute: async (opts: Record<string, string>) => {
      await runHook({
        name: opts.name,
        sessionName: opts.session_name,
        windowName: opts.window_name,
        paneIndex: opts.pane_index
      });
    }
  },
  {
    name: 'capture',
    description: '捕获指定 agent 面板内容并写入 .solo/capture/',
    args: [
      { syntax: '<agent-name>', description: 'agent 名称' },
      { syntax: '<pane-index>', description: 'pane 索引', parser: parseInt }
    ],
    execute: runCapture
  }
];

registerCommands(program, COMMANDS);

// 隐藏命令：由 startWorker 生成的后台 worker 进程调用，不暴露在 --help 中
program
  .command('_task-worker', { hidden: true })
  .description('后台轮询 worker 入口（内部使用）')
  .argument('<task-id>', '任务 ID')
  .argument('<session>', 'tmux session 名')
  .argument('<window>', 'tmux window 名')
  .argument('<pane-index>', 'pane 索引', parseInt)
  .argument('[agent-name]', 'agent 名称')
  .action(async (taskId: string, session: string, window: string, paneIndex: number, agentName?: string) => {
    await runTaskWorker(taskId, session, window, paneIndex, agentName);
  });

if (require.main === module) {
  program.parse();
}
