import { writeFileSync, mkdirSync } from 'fs';
import { info, debug } from '../logging';
import { readConfig } from '../core/yaml';
import { compareWithStored } from '../core/comparison';
import { updateTask } from './manager';
import { capturePane } from '../tmux';
import { CAPTURE_DIR } from '../config/paths';

const POLL_INTERVAL_MS = 30_000;
const DEFAULT_WAIT_MINUTES = 60;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const formatTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

/**
 * 后台轮询 pane 内容，等待 Claude 输出稳定（空闲）
 * - 每次轮询保存 debug 快照（带时间戳）到 .solo/capture-debug/ 目录
 * - 每次轮询以 saveOnChange=true 调用 compareWithStored，确保存储文件始终更新为最新内容
 * - 内容不变 → 更新任务状态为 completed，输出 idle 日志
 * - 超过最大等待时间 → 更新任务状态为 timeout，输出 timeout 日志
 * @param taskId 任务 ID（用于更新任务状态）
 * @param session tmux session 名
 * @param window tmux window 名
 * @param paneIndex pane 索引
 * @param agentName agent 名称（用于读取 waitTime 配置与构造存储文件路径）
 */
export const runPoll = async (taskId: string, session: string, window: string, paneIndex: number, agentName?: string): Promise<void> => {
  const config = readConfig();
  const waitMinutes = agentName ? (config.agents?.[agentName]?.waitTime ?? DEFAULT_WAIT_MINUTES) : DEFAULT_WAIT_MINUTES;
  const maxMs = waitMinutes * 60_000;
  const startTime = Date.now();
  const agentFilePath = `${CAPTURE_DIR}/${agentName ?? `${session}-${window}`}-${paneIndex}.md`;

  mkdirSync(CAPTURE_DIR, { recursive: true });

  let pollCount = 0;

  while (Date.now() - startTime < maxMs) {
    await sleep(POLL_INTERVAL_MS);
    pollCount++;

    const timestamp = formatTimestamp();
    const paneContent = await capturePane(session, window, paneIndex);
    const paneMarkdown = `${CAPTURE_DIR}/${agentName}-${paneIndex}.md`;
    writeFileSync(paneMarkdown, paneContent);
    debug(`[task:${taskId}] screenshot #${pollCount} at ${timestamp}, saved to ${paneMarkdown}`);

    debug(`[task:${taskId}] compare #${pollCount}: saveOnChange=true`);
    const { changed } = await compareWithStored(session, window, paneIndex, agentFilePath, true);
    debug(`[task:${taskId}] compare #${pollCount}: changed=${changed}`);

    if (!changed) {
      info(`[task:${taskId}] agent "${agentName ?? `${session}:${window}`}" idle: pane content stable`);
      updateTask(taskId, { status: 'completed', completedAt: new Date().toISOString() });
      return;
    }
  }

  debug(`[task:${taskId}] timeout after ${pollCount} comparisons`);
  info(`[task:${taskId}] agent "${agentName ?? `${session}:${window}`}" timeout after ${waitMinutes} minutes`);
  updateTask(taskId, { status: 'timeout', completedAt: new Date().toISOString() });
};
