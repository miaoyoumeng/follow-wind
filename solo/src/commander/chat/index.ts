import { Command } from 'commander';
import chalk from 'chalk';
import { validateWorkspace } from '../status';
import { getAgent } from '../../core/agents';
import { listPanesWithTitle, selectPane, sendKeys } from '../../tmux';

/**
 * 向指定 agent 的 claude pane 发送消息
 * @param agentName agent 名称
 * @param content 要发送的内容
 */
export const runChat = async (agentName: string, content: string): Promise<void> => {
  const sessionName = validateWorkspace();

  // 检查 agent 是否存在
  const agent = getAgent(agentName);
  if (!agent) {
    console.log(chalk.red(`❌ agent "${agentName}" 不存在`));
    return;
  }

  // 检查 agent 是否配置了 panes
  if (!agent.panes) {
    console.log(chalk.red(`❌ agent "${agentName}" 没有 claude pane`));
    return;
  }

  // 获取所有 pane 及其标题
  const panes = await listPanesWithTitle(sessionName, agentName);

  // 查找 claude pane
  const claudePane = panes.find(p => {
    return p.title === 'claude';
  });
  if (!claudePane) {
    console.log(chalk.red(`❌ agent "${agentName}" 没有 claude pane`));
    return;
  }

  // 选择 claude pane 并发送消息
  await selectPane(sessionName, agentName, claudePane.index);
  await sendKeys(sessionName, agentName, claudePane.index, content);
  await sendKeys(sessionName, agentName, claudePane.index, 'Enter');
};

export const registerChatCommand = (program: Command): void => {
  program
    .command('chat')
    .description('向指定 agent 的 claude pane 发送消息')
    .argument('<agent>', 'agent 名称')
    .argument('<content>', '要发送的内容')
    .action(async (agent: string, content: string) => {
      await runChat(agent, content);
    });
};
