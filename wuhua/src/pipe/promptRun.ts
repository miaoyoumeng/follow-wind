import { buildPaneKey } from '../tmux';
import { logger } from '../logging';
import { nowUTC } from '../utils/times';
import { getRouter } from '../task';
import { awaitPaneStop } from './waiter';
import type { PromptRunOptions, PromptRunOutcome } from './types';

/**
 * 独占 pane 执行一条 prompt：置 running → 提交 → 等 Claude Stop → 归位 idle
 * 执行期间该 pane 对其他指令返回 busy；busy / no-router 时不提交也不改变状态
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param prompt 要执行的 prompt 内容
 * @param timeoutMs 等待 Stop 的超时毫秒数
 * @param options 运行时选项（连接关闭回调）
 * @returns 执行结果
 */
export const runPromptOnPane = async (
  session: string,
  window: string,
  paneIndex: number,
  prompt: string,
  timeoutMs: number,
  options?: PromptRunOptions
): Promise<PromptRunOutcome> => {
  const key = buildPaneKey(session, window, paneIndex);
  const router = getRouter(key);
  if (!router) {
    logger.warn(`[promptRun:${key}] no router registered, pane 不在 wuhua session 中`);
    return 'no-router';
  }
  if (router.paneStatus.status === 'running') {
    logger.warn(`[promptRun:${key}] pane is running, reject`);
    return 'busy';
  }

  // 状态检查、置位与入队之间不能插入 await，
  // 否则并发的两个请求可能同时通过检查
  router.paneStatus.status = 'running';
  router.enqueue({ prompt, createdAt: nowUTC() });
  logger.debug(`[promptRun:${key}] acquired pane, prompt sent`);

  try {
    await router.paneRolling();
    const outcome = await awaitPaneStop(session, window, paneIndex, timeoutMs, options);
    logger.info(`[promptRun:${key}] finished, outcome=${outcome}`);
    return outcome;
  } finally {
    // 等待期间可能已被 StopFailure 置为 error，保留 error 不被本轮收尾覆盖
    if (router.paneStatus.status === 'running') {
      router.paneStatus.status = 'idle';
    }
  }
};
