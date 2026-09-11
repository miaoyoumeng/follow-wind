import { spawn } from 'child_process';
import { join } from 'path';
import { registerTask, type Task } from '../task';
import { info } from '../logging';

// 编译后 wait.js 在 dist/process/，solo.js 在 dist/bin/
const DEFAULT_WORKER_PATH = join(__dirname, '..', 'bin', 'solo.js');

/**
 * 启动后台 worker 进程执行轮询任务
 * @param taskId 任务 ID
 * @param session tmux session 名
 * @param window tmux window 名
 * @param paneIndex pane 索引
 * @param agentName agent 名称（可选）
 * @param workerPath worker 脚本路径（测试时覆盖）
 */
export const startWorker = (
  taskId: string,
  session: string,
  window: string,
  paneIndex: number,
  agentName?: string,
  workerPath: string = DEFAULT_WORKER_PATH
): number => {
  const args = ['_task-worker', taskId, session, window, String(paneIndex)];
  if (agentName) args.push(agentName);

  const child = spawn(process.execPath, [workerPath, ...args], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  return child.pid ?? 0;
};

/**
 * 注册后台轮询任务，立即返回（不阻塞当前命令）
 * 后台 worker 进程每 30 秒对比 pane 内容，等待 Claude 输出稳定
 * @param session tmux session 名
 * @param window tmux window 名
 * @param paneIndex pane 索引
 * @param agentName agent 名称（可选）
 * @returns 注册后的任务记录
 */
export const waitForIdle = (session: string, window: string, paneIndex: number, agentName?: string): Task => {
  const taskId = registerTask({ agentName, session, window, paneIndex });
  const pid = startWorker(taskId, session, window, paneIndex, agentName);
  info(`[chat] task ${taskId} registered (pid: ${pid}), polling in background`);
  return {
    completedAt: '',
    type: 'local_bash',
    id: taskId,
    agentName,
    status: 'pending',
    pid,
    session,
    window,
    paneIndex,
    createdAt: new Date().toISOString()
  };
};
