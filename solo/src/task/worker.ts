import { Command } from 'commander';
import { runPoll } from './polling';
import { info } from '../logging';

/**
 * 后台 worker 入口：解析参数并启动轮询
 * 运行在由 child_process.spawn 创建的独立 Node.js 进程中
 * @param taskId 任务 ID
 * @param session tmux session 名
 * @param window tmux window 名
 * @param paneIndex pane 索引
 * @param agentName agent 名称（可选）
 */
export const runTaskWorker = async (taskId: string, session: string, window: string, paneIndex: number, agentName?: string): Promise<void> => {
  info(`[task:${taskId}] worker started`);
  await runPoll(taskId, session, window, paneIndex, agentName);
};

/**
 * 注册隐藏命令 _task-worker（供后台进程调用，用户不直接使用）
 * @param program commander 实例
 */
export const registerTaskWorkerCommand = (program: Command): void => {
  program
    .command('_task-worker')
    .argument('<task-id>', '任务 ID')
    .argument('<session>', 'tmux session')
    .argument('<window>', 'tmux window')
    .argument('<pane-index>', 'pane 索引')
    .argument('[agent-name]', 'agent 名称')
    .action(async (taskId: string, session: string, window: string, paneIndex: string, agentName?: string) => {
      await runTaskWorker(taskId, session, window, parseInt(paneIndex, 10), agentName);
    });
};
