#!/usr/bin/env node

import { Command } from 'commander';
import { getSessionName, listSessions, killSession } from '../tmux';
import { runInit } from '../commander/init';
import { runVersion } from '../commander/version';
import { runStatus } from '../commander/status';
import { runStart } from '../commander/start';
import { runStop } from '../commander/stop';
import { runDashboard } from '../commander/dashboard';
import { getVersion } from '../core/version';

const program = new Command();

program.name('solo').description('通过 tmux 管理多个 Claude 命令窗口').version(getVersion());

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

program
  .command('start')
  .description('启动本项目的 tmux session')
  .action(async () => {
    await runStart();
  });

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
  .command('list')
  .description('列出所有会话')
  .action(async () => {
    const sessions = await listSessions();
    if (sessions.length === 0) {
      console.log('没有活动会话');
      return;
    }
    sessions.forEach(s => console.log(`  ${s.name} (${s.dir})`));
  });

program
  .command('kill')
  .description('终止会话')
  .action(async () => {
    const sessionName = getSessionName();
    await killSession(sessionName);
    console.log(`会话 ${sessionName} 已终止`);
  });

program.parse();
