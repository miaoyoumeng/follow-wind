import chalk from 'chalk';
import { addAgent, getAgent } from '../../../core/agents';
import { validateWorkspace } from '../../status';

export const runAgentAdd = async (name: string, path: string): Promise<void> => {
  validateWorkspace();

  if (getAgent(name)) {
    console.log(chalk.red(`Agent "${name}" already exists. Please choose a different name.`));
    return;
  }

  addAgent(name, path);
  console.log(chalk.green(`已添加 agent "${name}"，工作目录: ${path}`));
};
