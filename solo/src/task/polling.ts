import md5 from 'md5';

import { info, debug } from '../logging';
import { readConfig } from '../config';
import { updateTask } from './manager';
import { capturePane } from '../tmux';
import { CAPTURE_DIR } from '../config/paths';
import { writeFile, readFile } from '../utils';

const POLL_INTERVAL_MS = 30_000;
const DEFAULT_WAIT_MINUTES = 60;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 纯字符串内容比较（无文件操作）
 * - storedContent 为 null（无基线） → 返回 true
 * - 内容一致 → 返回 false
 * - 内容不一致 → 返回 true
 * @param currentContent 当前 pane 内容
 * @param storedContent 上次存储的 pane 内容（null 表示无基线）
 */
export const compareWithStored = (currentContent: string, storedContent: string | null): boolean => {
  if (storedContent === null) return true;
  const current_hash: string = md5(currentContent);
  const stored_hash: string = md5(storedContent);
  debug(`compareWithStored current_hash: ${current_hash} vs stored_hash ${stored_hash}, and result = ${current_hash !== stored_hash}`);
  return current_hash !== stored_hash;
};

/**
 * 后台轮询 pane 内容，等待 Claude 输出稳定（空闲）
 * - 每次轮询只调用一次 capturePane，间隔至少 30 秒
 * - 先 readFile 读取上次存储内容，再纯字符串比较，最后 writeFile 保存
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

  // 先读取上次存储的内容（用于比较）
  let storedContent: string | null = readFile(agentFilePath);

  let pollCount = 0;

  while (Date.now() - startTime < maxMs) {
    await sleep(POLL_INTERVAL_MS);
    pollCount++;

    // 每次轮询只调用一次 capturePane
    const paneContent = await capturePane(session, window, paneIndex);
    // 写入文件（作为 debug 快照 + 下次比较基线）
    writeFile(agentFilePath, paneContent);
    // 纯字符串比较
    const changed = compareWithStored(paneContent, storedContent);
    if (!changed) {
      info(`[task:${taskId}] agent "${agentName ?? `${session}:${window}`}" idle: pane content stable`);
      updateTask(taskId, { status: 'completed', completedAt: new Date().toISOString() });
      return;
    }
    storedContent = paneContent;
  }

  debug(`[task:${taskId}] timeout after ${pollCount} comparisons`);
  info(`[task:${taskId}] agent "${agentName ?? `${session}:${window}`}" timeout after ${waitMinutes} minutes`);
  updateTask(taskId, { status: 'timeout', completedAt: new Date().toISOString() });
};
