import chalk from 'chalk';
import { getAgent, type Agent } from '../../../core/agents';

/**
 * 查找 agent，不存在时打印错误提示并返回 undefined
 */
const findAgentOrWarn = (name: string): Agent | undefined => {
  const agent = getAgent(name);
  if (!agent) {
    console.log(chalk.red(`Agent "${name}" does not exist.`));
  }
  return agent;
};

/**
 * 显示指定 agent 的 workspace
 */
export const runAgentWorkspace = (name: string): void => {
  const agent = findAgentOrWarn(name);
  if (!agent) return;
  console.log(agent.workspace);
};

/**
 * 显示指定 agent 的 panes 信息
 */
export const runAgentPanes = (name: string): void => {
  const agent = findAgentOrWarn(name);
  if (!agent) return;

  const panes = agent.panes;
  if (!panes || Object.keys(panes).length === 0) {
    console.log(chalk.yellow(`agent "${name}" 未配置 panes`));
    return;
  }

  for (const [key, value] of Object.entries(panes)) {
    console.log(`${key}: ${value}`);
  }
};
