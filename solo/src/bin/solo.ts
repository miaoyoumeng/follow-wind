#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { runInit } from '../commander/init';
import { runVersion } from '../commander/version';
import { runStatus } from '../commander/status';
import { registerStartCommand } from '../commander/start';
import { runStop } from '../commander/stop';
import { runDashboard } from '../commander/dashboard';
import { runAgents } from '../commander/agents';
import { registerAgentCommand } from '../commander/agent';
import { registerChatCommand } from '../commander/chat';
import { registerHookCommand } from '../commander/hook';
import { registerCaptureCommand } from '../commander/capture';
import { registerUsageCommand } from '../commander/usage';
import { registerTasksCommand } from '../commander/tasks';
import { registerTaskWorkerCommand } from '../task/worker';
import { getVersion } from '../core/version';
import { getLoggingConfig, setup as setupLogger } from '../logging';

/** 从 .solo/config 读取日志配置并初始化日志模块 */
export const initLogger = (): void => {
  const loggingConfig = getLoggingConfig();
  if (loggingConfig) setupLogger(loggingConfig);
};

// 未捕获异常统一输出友好错误（不打印堆栈）
process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(chalk.red(`❌ ${message}`));
  process.exit(1);
});

initLogger();

const program = new Command();

program.name('solo').description('通过 tmux 管理多个 Claude 命令窗口').version(getVersion());

registerAgentCommand(program);

program
  .command('init')
  .description('检查并初始化环境')
  .action(async () => {
    await runInit();
  });

program
  .command('version')
  .description('检查环境并显示版本')
  .action(async () => {
    await runVersion();
  });

program
  .command('status')
  .description('检查工作目录是否为合规的 solo 工作区')
  .action(async () => {
    await runStatus();
  });

registerStartCommand(program);

program
  .command('stop')
  .description('终止本项目的 tmux session')
  .action(async () => {
    await runStop();
  });

program
  .command('dashboard')
  .description('进入本项目的 tmux session')
  .action(async () => {
    await runDashboard();
  });

program
  .command('agents')
  .description('显示 .solo/config 中的 agent 列表')
  .action(async () => {
    await runAgents();
  });

registerChatCommand(program);
registerHookCommand(program);
registerCaptureCommand(program);
registerUsageCommand(program);
registerTasksCommand(program);
registerTaskWorkerCommand(program);

program.parse();
