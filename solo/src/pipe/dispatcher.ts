import { TmuxRouter } from './router';
import { logger } from '../logging';
import type { Instruct } from './types';

const routerMap = new Map<string, TmuxRouter>();

const buildPaneKey = (session: string, window: string, paneIndex: number): string =>
  `${session}:${window}.${paneIndex}`;

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
  instruct: Instruct
): Promise<boolean> => {
  const key = buildPaneKey(session, window, paneIndex);
  logger.debug(`[dispatch:${key}] received instruct: ${instruct.command}`);
  const router = routerMap.get(key);
  if (!router) {
    logger.warn(`[dispatch:${key}] no router registered, dropping instruct`);
    return false;
  }
  router.enqueue(instruct);
  await router.paneRolling();
  logger.debug(`[dispatch:${key}] enqueued and triggering paneRolling`);
  return true;
};

/**
 * 通知指定 pane 的 router 已稳定，尝试处理队列中下一条指令
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 */
export const notifyStable = (session: string, window: string, paneIndex: number): void => {
  const key = buildPaneKey(session, window, paneIndex);
  const router = routerMap.get(key);
  if (!router) {
    logger.warn(`[notifyStable:${key}] no router registered`);
    return;
  }
  router.markStable();
  void router.paneRolling();
};

/**
 * 注册 router（相同 pane 返回同一实例）
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @returns 该 pane 对应的 TmuxRouter 实例
 */
export const registerRouter = (session: string, window: string, paneIndex: number): TmuxRouter => {
  const key = buildPaneKey(session, window, paneIndex);
  let router = routerMap.get(key);
  if (!router) {
    router = new TmuxRouter();
    router.session = session;
    router.window = window;
    router.paneIndex = paneIndex;
    routerMap.set(key, router);
  }
  logger.debug(`[dispatcher] key: ${key}, register tmux router.`);
  return router;
};

/** 清理所有 router（用于 daemon 停止时释放内存） */
export const clearAll = (): void => {
  routerMap.clear();
};
