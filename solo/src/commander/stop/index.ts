import chalk from 'chalk';
import { sessionExists, killSession } from '../../tmux';
import { validateWorkspace } from '../status';

export const runStop = async (): Promise<void> => {
  const sessionName = validateWorkspace();
  const exists = await sessionExists(sessionName);

  if (exists) {
    await killSession(sessionName);
    console.log(chalk.green(`✅ session ${sessionName} 已终止`));
  } else {
    console.log(chalk.yellow(`⚠️ session ${sessionName} is already terminated`));
  }
};
