import chalk from 'chalk';
import { execa } from 'execa';

import { sessionExists } from '../tmux';
import { validateWorkspace } from './status';

/**
 * 进入本项目的 tmux session：接管终端 attach 目标 session，退出后透传退出码
 */
export const runDashboard = async (): Promise<void> => {
  const sessionName = validateWorkspace();
  const exists = await sessionExists(sessionName);

  if (!exists) {
    console.log(chalk.red(`❌ tmux session "${sessionName}" is not running. Please use \`wuhua start\` first.`));
    process.exit(1);
  }

  const { exitCode } = await execa('tmux', ['attach-session', '-t', sessionName], {
    stdio: 'inherit',
    reject: false
  });
  process.exit(exitCode ?? 0);
};
