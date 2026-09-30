import { logger } from '../logging';
import { nowUTC } from '../utils/times';
import { buildPaneKey } from '../tmux';
import type { Instruct } from './types';
import { getRouter } from '../task';

/**
 * 分发指令到指定 pane 的队列；若该 pane 已注册 router 则触发 roller
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param instruct 要执行的指令
 * @returns true 表示指令已入队并触发 roller；false 表示未注册 router
 */
export const dispatch = async (
  session: string,
  window: string,
  paneIndex: number,
  instruct: Partial<Instruct>
): Promise<boolean> => {
  const key = buildPaneKey(session, window, paneIndex);
  const fullInstruct: Instruct = { ...instruct, createdAt: nowUTC() } as Instruct;
  logger.debug(`[dispatch:${key}] received instruct: ${fullInstruct.prompt}`);
  const router = getRouter(key);
  if (!router) {
    logger.warn(`[dispatch:${key}] no router registered, dropping instruct`);
    return false;
  }
  router.enqueue(fullInstruct);
  await router.paneRolling();
  logger.debug(`[dispatch:${key}] enqueued and triggering paneRolling`);
  return true;
};

/**
 * 触发指定 pane 的 router 执行下一次 paneRolling（由 Stop hook 通过 IPC 触发）
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 */
export const triggerPaneRolling = (session: string, window: string, paneIndex: number): void => {
  const key = buildPaneKey(session, window, paneIndex);
  const router = getRouter(key);
  if (!router) {
    logger.warn(`[triggerPaneRolling:${key}] no router registered`);
    return;
  }
  void router.paneRolling();
};
