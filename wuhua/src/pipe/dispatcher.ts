import { logger } from '../logging';
import { nowUTC } from '../utils/times';
import { buildPaneKey } from '../tmux';
import type { DispatchResult, Instruct, PaneStatus } from './types';
import { getRouter } from '../task';
import { settleWait } from './waiter';

/**
 * 分发指令到指定 pane 的队列；若该 pane 已注册 router 则触发 roller
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param instruct 要执行的指令
 * @returns 分发结果：dispatched=false 时 reason 说明原因
 */
export const dispatch = async (
  session: string,
  window: string,
  paneIndex: number,
  instruct: Partial<Instruct>
): Promise<DispatchResult> => {
  const key = buildPaneKey(session, window, paneIndex);
  const fullInstruct: Instruct = { ...instruct, createdAt: nowUTC() } as Instruct;
  logger.debug(`[dispatch:${key}] received instruct: ${fullInstruct.prompt}`);
  const router = getRouter(key);
  if (!router) {
    logger.warn(`[dispatch:${key}] no router registered, dropping instruct`);
    return { dispatched: false, reason: 'no-router' };
  }
  // 仅 running 拒绝：error 表示上一轮异常结束，允许新任务覆盖提交
  if (router.paneStatus.status === 'running') {
    logger.warn(`[dispatch:${key}] pane is busy, reject instruct`);
    return { dispatched: false, reason: 'busy' };
  }
  // 状态检查、置位与入队之间不能插入 await，
  // 否则并发的两个请求可能同时通过检查
  router.paneStatus.status = 'running';
  router.enqueue(fullInstruct);
  await router.paneRolling();
  logger.debug(`[dispatch:${key}] enqueued and triggering paneRolling`);
  return { dispatched: true };
};

/**
 * 查询指定 pane 的状态
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @returns 该 pane 的状态；未注册 router 时返回 null
 */
export const getPaneStatus = (session: string, window: string, paneIndex: number): PaneStatus | null => {
  const router = getRouter(buildPaneKey(session, window, paneIndex));
  return router?.paneStatus ?? null;
};

/**
 * 触发指定 pane 的 router 执行下一次 paneRolling（由 Stop hook 通过 IPC 触发）
 * Claude 停止即意味着该 pane 空闲，故一并把状态归位 idle 并唤醒等待方
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 */
export const triggerPaneRolling = (session: string, window: string, paneIndex: number): void => {
  const key = buildPaneKey(session, window, paneIndex);
  const router = getRouter(key);
  // router 缺失也要唤醒等待方，否则 wuhua prompt 会一路挂到超时
  settleWait(session, window, paneIndex);
  if (!router) {
    logger.warn(`[triggerPaneRolling:${key}] no router registered`);
    return;
  }
  router.paneStatus.status = 'idle';
  void router.paneRolling();
};

/**
 * 把指定 pane 置为 error（由 StopFailure hook 通过 IPC 触发）
 * 与 triggerPaneRolling 的不对称是刻意的：异常结束的回合既不消费队列，
 * 也不结算等待方（等待方照常等到超时收尾）
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @returns 是否命中已注册的 pane
 */
export const markPaneError = (session: string, window: string, paneIndex: number): boolean => {
  const key = buildPaneKey(session, window, paneIndex);
  const router = getRouter(key);
  if (!router) {
    logger.warn(`[markPaneError:${key}] no router registered`);
    return false;
  }
  router.paneStatus.status = 'error';
  logger.warn(`[markPaneError:${key}] pane marked as error`);
  return true;
};
