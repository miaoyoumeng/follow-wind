import { Command } from 'commander';
import chalk from 'chalk';
import { validateWorkspace } from './status';
import { getAgent } from '../agents';
import { listPanesWithTitle, selectPane, sendKeysEnter } from '../tmux';
import { waitForIdle } from '../process/wait';
import { readPidFile, isProcessAlive } from '../process';
import { registerTask as ipcRegisterTask, statTask as ipcStatTask } from '../ipc';
import type { TaskStat } from '../task';

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
 * 通过 IPC 获取任务统计并显示
 */
const printTaskStat = async (): Promise<void> => {
  try {
    const stat = (await ipcStatTask()) as TaskStat;
    console.log(
      chalk.gray(
        `  tasks: ${stat.pending} pending, ${stat.running} running, ${stat.completed} completed, ${stat.timeout} timeout, ${stat.failed} failed, ${stat.killed} killed`
      )
    );
  } catch {
    console.log(chalk.yellow('  📋 任务统计获取失败，daemon IPC 连接异常'));
  }
};

/**
 * 向指定 agent 的 claude pane 发送消息，并轮询等待 Claude 输出稳定
 * @param agentName agent 名称
 * @param content 要发送的内容
 */
export const runChat = async (agentName: string, content: string): Promise<void> => {
  const sessionName = validateWorkspace();

  // 检查 daemon 是否存活
  if (!checkDaemonAlive()) return;

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

  // 通过 IPC 注册 chat 任务到 daemon taskStorage
  try {
    await ipcRegisterTask({ type: 'local_agent' });
  } catch {
    console.log(chalk.yellow('📋 IPC 注册任务失败，daemon 连接异常'));
    return;
  }

  // 选择 claude pane 并发送消息
  await selectPane(sessionName, agentName, claudePane.index);
  await sendKeysEnter(sessionName, agentName, claudePane.index, content);

  // 显示任务统计
  await printTaskStat();

  // 轮询等待 Claude 输出稳定
  waitForIdle(sessionName, agentName, claudePane.index, agentName);
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
