import { spawn } from 'child_process';
import chalk from 'chalk';
import { sessionExists } from '../../tmux';
import { validateWorkspace } from '../status';

export const runDashboard = async (): Promise<void> => {
  const sessionName = validateWorkspace();
  const exists = await sessionExists(sessionName);

  if (!exists) {
    console.log(chalk.red(`❌ tmux session "${sessionName}" is not running. Please use \`solo start\` first.`));
    process.exit(1);
  }

  // 使用 spawn 维持终端状态
  const tmux = spawn('tmux', ['attach-session', '-t', sessionName], {
    stdio: 'inherit'
  });

  tmux.on('exit', code => {
    process.exit(code ?? 0);
  });
};
