import chalk from 'chalk';
import { sessionExists, createSession, attachSession } from '../../tmux';
import { validateWorkspace } from '../status';

export async function runStart(): Promise<void> {
  const sessionName = validateWorkspace();
  const exists = await sessionExists(sessionName);

  if (!exists) {
    await createSession(sessionName, process.cwd());
    console.log(chalk.green(`✅ session ${sessionName} 已创建`));
  } else {
    await attachSession(sessionName);
    console.log(chalk.green(`✅ 已进入 session ${sessionName}`));
  }
}
