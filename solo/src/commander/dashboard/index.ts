import chalk from 'chalk';
import { terminal } from '../../process';
import { sessionExists } from '../../tmux';
import { validateWorkspace } from '../status';

export const runDashboard = async (): Promise<void> => {
  const sessionName = validateWorkspace();
  const exists = await sessionExists(sessionName);

  if (!exists) {
    console.log(chalk.red(`❌ tmux session "${sessionName}" is not running. Please use \`solo start\` first.`));
    process.exit(1);
  }

  terminal('tmux', ['attach-session', '-t', sessionName]);
};
