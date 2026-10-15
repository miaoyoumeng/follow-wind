#!/usr/bin/env node
import { Command } from 'commander';

import {
  runInit,
  runVersion,
  runStatus,
  runStart,
  runStop,
  runDashboard,
  runChat,
  runHook,
  runCapture,
  runUsage,
  runDoctor,
  runStory,
  runPrompt,
  runAgent,
  type CommandSpec
} from '../cli';

import { getVersion } from '../utils/version';
import { setConfigPath } from '../config';
import { getLoggingConfig, logger, setup as setupLogger } from '../logging';

/** 从 .wuhua/config 读取日志配置并初始化日志模块（始终启用，缺失字段使用默认值） */
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
      if (arg.parser) {
        cmd.argument(arg.syntax, arg.description, arg.parser);
      } else {
        cmd.argument(arg.syntax, arg.description);
      }
    }

    for (const opt of spec.options ?? []) {
      if (opt.isRequired) {
        cmd.requiredOption(opt.flags, opt.description);
      } else if (opt.parser) {
        cmd.option(opt.flags, opt.description, opt.parser);
      } else {
        cmd.option(opt.flags, opt.description);
      }
    }

    if (spec.allowExcessArguments === false) {
      cmd.allowExcessArguments(false);
    }

    cmd.action(async (...values: unknown[]) => {
      // CommandSpec.execute 声明为 (...args: never[]) 以兼容各命令各异的签名，此处收窄后调用
      await (spec.execute as (...args: unknown[]) => Promise<void> | void)(...values);
    });
  }
};

// 仅在直接执行时运行副作用（import 时跳过，使 wuhua.ts 可安全导入测试）
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
  .name('wuhua')
  .description('通过 tmux 管理多个 Claude 命令窗口')
  .version(getVersion())
  .option('--config <path>', '指定配置文件路径（默认 .wuhua/config.yaml）');

// 在执行任何子命令前，解析 --config 选项并更新配置路径
program.hook('preAction', (thisCommand: InstanceType<typeof Command>) => {
  const opts = thisCommand.opts<{ config?: string }>();
  if (opts.config) {
    setConfigPath(opts.config);
    setupLogger(getLoggingConfig());
  }
});

/** 命令表：声明顺序即 --help 的列出顺序 */
const COMMANDS: readonly CommandSpec[] = [
  { name: 'init', description: '检查并初始化环境', execute: runInit },
  { name: 'version', description: '检查环境并显示版本', execute: runVersion },
  { name: 'doctor', description: '诊断环境和配置', execute: runDoctor },
  { name: 'status', description: '检查工作目录是否为合规的 wuhua 工作区', execute: runStatus },
  { name: 'start', description: '启动本项目的 tmux session', allowExcessArguments: false, execute: runStart },
  { name: 'stop', description: '终止本项目的 tmux session', execute: runStop },
  { name: 'dashboard', description: '进入本项目的 tmux session', execute: runDashboard },
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
    options: [
      { flags: '--agent <agent>', description: 'agent 名称', isRequired: true },
      { flags: '--prompt <prompt>', description: '要发送的内容', isRequired: true }
    ],
    allowExcessArguments: false,
    execute: (opts: { agent: string; prompt: string }): Promise<void> => runChat(opts.agent, opts.prompt)
  },
  {
    name: 'hook',
    description: 'hook 回调入口（由 tmux run-shell 自动调用）',
    options: [
      { flags: '--endpoint <endpoint>', description: 'hook 终端类型（tmux | claude）', isRequired: true },
      { flags: '--event <event>', description: 'hook 事件名' },
      { flags: '--workspace <workspace>', description: '工作目录（可选）' }
    ],
    execute: async (opts: Record<string, string>): Promise<void> => {
      await runHook({
        endpoint: opts.endpoint as 'tmux' | 'claude',
        event: opts.event,
        workspace: opts.workspace
      });
    }
  },
  {
    name: 'capture',
    description: '捕获指定 agent 面板内容并写入 .wuhua/capture/',
    args: [
      { syntax: '<agent-name>', description: 'agent 名称' },
      { syntax: '<pane-index>', description: 'pane 索引', parser: parseInt }
    ],
    execute: runCapture
  },
  {
    name: 'story',
    description: '依据 feature 文件为主题生成 user story prompt',
    options: [
      { flags: '--agent <agent>', description: 'agent 名称（all 表示配置中的全部 agent）', isRequired: true },
      { flags: '--file <path>', description: 'feature 文件路径（相对路径基于 agent 的 workspace）', isRequired: true }
    ],
    execute: (opts: Record<string, string>): void => {
      runStory(opts.agent, opts.file);
    }
  },
  {
    name: 'prompt',
    description: '按 prompts 索引中的 todo 列表逐条执行 prompt',
    options: [
      { flags: '--agent <agent>', description: 'agent 名称（all 表示配置中的全部 agent）', isRequired: true },
      {
        flags: '--timeout <minutes>',
        description: '等待 Claude 空闲的超时分钟数（默认取 agent 的 waitTime 或 60）',
        parser: parseInt
      }
    ],
    allowExcessArguments: false,
    execute: (opts: { agent: string; timeout?: number }): Promise<void> => runPrompt(opts.agent, opts.timeout)
  },
  {
    name: 'agent',
    description: '把 shell 命令提交到 agent 的 tmux pane 执行',
    options: [
      { flags: '--name <name>', description: 'agent 名称（all 表示所有 activate 的 agent）', isRequired: true },
      { flags: '--pane-index <index>', description: '目标 tmux pane 索引（默认 1）', parser: parseInt },
      { flags: '--bash <command>', description: '要提交执行的 shell 命令', isRequired: true }
    ],
    allowExcessArguments: false,
    execute: (opts: { name: string; paneIndex?: number; bash: string }): Promise<void> =>
      runAgent(opts.name, opts.paneIndex, opts.bash)
  }
];

registerCommands(program, COMMANDS);

if (require.main === module) {
  program.parse();
}
