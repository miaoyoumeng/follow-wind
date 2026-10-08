import { TmuxRouter } from '../pipe';
import { buildPaneKey } from '../tmux';
import { logger } from '../logging';

// 路由器存储（以 tmux pane 坐标为 key）
const routerMap = new Map<string, TmuxRouter>();

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
    router = new TmuxRouter(session, window, paneIndex);
    routerMap.set(key, router);
  }
  logger.debug(`[chatTaskStorage] key: ${key}, register tmux router.`);
  return router;
};

/**
 * 获取路由器
 * @param paneKey pane 坐标 key
 */
export const getRouter = (paneKey: string): TmuxRouter | undefined => {
  return routerMap.get(paneKey);
};

/**
 * 列出所有路由器
 */
export const listRouters = (): TmuxRouter[] => {
  return Array.from(routerMap.values());
};

/** 清理所有 router（用于 daemon 停止时释放内存） */
export const clearAll = (): void => {
  routerMap.clear();
};
