import chalk from 'chalk';
import { listWindows } from '../../tmux';
import { validateWorkspace } from '../status';

export const runWindows = async (): Promise<void> => {
  const sessionName = validateWorkspace();
  const windows = await listWindows(sessionName);

  if (windows.length === 0) {
    console.log(chalk.yellow('当前 session 没有 window'));
    return;
  }

  console.log(chalk.blue.bold(`Session: ${sessionName}\n`));
  for (const win of windows) {
    console.log(chalk.cyan(`- ${win.name}\t${win.panes} panes`));
  }
};
