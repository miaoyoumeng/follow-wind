import chalk from 'chalk';

import { validateWorkspace } from './status';
import { checkDaemonAlive } from './daemon';
import { getAgent } from '../agents';
import { listPanesWithTitle } from '../tmux';
import { ipcDispatch } from '../ipc';
import { logger } from '../logging';
import type { DispatchResult } from '../pipe';

/**
 * 校验 agent 配置并返回 claude pane，失败时打印错误并返回 null
 * @param agentName agent 名称
 * @param sessionName tmux session 名
 */
const resolveClaudePane = async (agentName: string, sessionName: string): Promise<{ index: number } | null> => {
  const agent = getAgent(agentName);
  if (!agent) {
    console.log(chalk.red(`❌ agent "${agentName}" 不存在`));
    return null;
  }
  if (!agent.panes) {
    console.log(chalk.red(`❌ agent "${agentName}" 没有 claude pane`));
    return null;
  }
  const panes = await listPanesWithTitle(sessionName, agentName);
  const claudePane = panes.find(p => p.title === 'claude');
  if (!claudePane) {
    console.log(chalk.red(`❌ agent "${agentName}" 没有 claude pane`));
    return null;
  }
  return claudePane;
};

/**
 * 按分发结果打印提示；被 wuhua prompt 独占拒绝时置退出码 1
 * @param agentName agent 名称
 * @param result 分发结果
 */
const reportDispatch = (agentName: string, result: DispatchResult): void => {
  if (result.dispatched) {
    console.log(chalk.green('✅ chat 任务提交成功。'));
    return;
  }
  if (result.reason === 'busy') {
    console.log(chalk.red(`❌ agent "${agentName}" 的 pane 正忙（上一轮任务尚未结束），指令已拒绝`));
    process.exitCode = 1;
    return;
  }
  console.log(chalk.yellow(`📋 agent "${agentName}" 尚未注册 router，指令未分发`));
};

/**
 * 向指定 agent 的 claude pane 发送消息，并轮询等待 Claude 输出稳定
 * @param agentName agent 名称
 * @param prompt 要发送的内容
 */
export const runChat = async (agentName: string, prompt: string): Promise<void> => {
  const sessionName = validateWorkspace();
  if (!checkDaemonAlive()) {
    return;
  }

  const claudePane = await resolveClaudePane(agentName, sessionName);
  if (!claudePane) {
    return;
  }

  logger.debug(`[chat] dispatch to ${agentName} pane ${claudePane.index}: ${prompt}`);

  try {
    const result = await ipcDispatch(sessionName, agentName, claudePane.index, prompt);
    reportDispatch(agentName, result);
  } catch (err) {
    logger.error(`[chat] IPC dispatch failed: ${String(err)}`);
    console.log(chalk.yellow('📋 IPC 任务提交失败，请查看日志'));
  }
};
