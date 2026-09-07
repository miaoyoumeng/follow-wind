import chalk from 'chalk';
import { getAgents } from '../../core/agents';
import { validateWorkspace } from '../status';

export const runAgents = async (): Promise<void> => {
  validateWorkspace();

  const agents = getAgents();

  if (agents.length === 0) {
    console.log(chalk.yellow('暂无 agent 配置'));
    return;
  }

  for (const agent of agents) {
    console.log(chalk.cyan(`- ${agent.name}`));
  }
};
