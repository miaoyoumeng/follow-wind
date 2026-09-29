import chalk from 'chalk';

import { validateWorkspace } from './status';
import { getAgent } from '../agents';
import { listPanesWithTitle } from '../tmux';
import { readPidFile, isProcessAlive } from '../bootstrap';
import { ipcRegisterTask, ipcDispatch } from '../ipc';
import { logger } from '../logging';
/**
 * 检查 daemon 进程是否存活
 * @returns true 表示 daemon 存活，false 表示未启动并已打印提示
 */
const checkDaemonAlive = (): boolean => {
  const pid = readPidFile();
  const isAlive = pid !== null && isProcessAlive(pid);
  if (!isAlive) {
    console.log(chalk.yellow('📋 solo 未启动'));
    console.log(chalk.gray('   请先运行 `solo start` 启动服务'));
  }
  return isAlive;
};

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
 * 向指定 agent 的 claude pane 发送消息，并轮询等待 Claude 输出稳定
 * @param agentName agent 名称
 * @param content 要发送的内容
 */
export const runChat = async (agentName: string, content: string): Promise<void> => {
  const sessionName = validateWorkspace();
  if (!checkDaemonAlive()) {
    return;
  }

  const claudePane = await resolveClaudePane(agentName, sessionName);
  if (!claudePane) {
    return;
  }

  logger.debug(`[chat] dispatch to ${agentName} pane ${claudePane.index}: ${content}`);

  try {
    await ipcRegisterTask({
      type: 'claude',
      agentName,
      session: sessionName,
      window: agentName,
      paneIndex: claudePane.index
    });
    const dispatched = await ipcDispatch(sessionName, agentName, claudePane.index, content);
    if (dispatched) {
      console.log(chalk.green('✅ chat 任务提交成功。'));
    } else {
      console.log(chalk.yellow(`📋 agent "${agentName}" 尚未注册 router，指令未分发`));
    }
  } catch {
    console.log(chalk.yellow('📋 IPC 任务提交失败，daemon 连接异常'));
  }
};
