#!/usr/bin/env node

import { Command } from 'commander';
import { createSession, listSessions, killSession } from '../tmux/index.js';
import { startClaude } from '../claude/index.js';
import { runInit } from '../commander/init/index.js';
import { runVersion } from '../commander/version/index.js';

const program = new Command();

program
  .name('solo')
  .description('通过 tmux 管理多个 Claude 命令窗口')
  .version('1.0.0');

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
  .command('start [name]')
  .description('启动新的 Claude 会话')
  .option('-d, --dir <path>', '工作目录', process.cwd())
  .action(async (name: string | undefined, options: { dir: string }) => {
    const sessionName = name || `claude-${Date.now()}`;
    await createSession(sessionName, options.dir);
    await startClaude(sessionName);
    console.log(`会话 ${sessionName} 已启动`);
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
  .command('kill <name>')
  .description('终止指定会话')
  .action(async (name: string) => {
    await killSession(name);
    console.log(`会话 ${name} 已终止`);
  });

program.parse();
