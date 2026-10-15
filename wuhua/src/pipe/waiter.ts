import { buildPaneKey } from '../tmux';
import { logger } from '../logging';
import type { PendingWait, PromptRunOptions, WaitOutcome } from './types';

// 挂起等待 Claude Stop 的登记表（以 pane 坐标为 key，同一 pane 至多一个等待者）
const waitMap = new Map<string, PendingWait>();

/**
 * 结束一个等待项：出表、清定时器、结算
 * @param key pane 坐标 key
 * @param outcome 结算结果
 * @returns 是否命中（无等待项时返回 false）
 */
const finishWait = (key: string, outcome: WaitOutcome): boolean => {
  const waiter = waitMap.get(key);
  if (!waiter) {
    return false;
  }
  waitMap.delete(key);
  clearTimeout(waiter.timer);
  waiter.resolve(outcome);
  return true;
};

/**
 * 登记一次对 Claude Stop 的等待，超时自动以 timeout 结算
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @param timeoutMs 等待超时的毫秒数
 * @param options 运行时选项（连接关闭回调）
 * @returns 等待结果
 */
export const awaitPaneStop = (
  session: string,
  window: string,
  paneIndex: number,
  timeoutMs: number,
  options?: PromptRunOptions
): Promise<WaitOutcome> => {
  const key = buildPaneKey(session, window, paneIndex);
  // 同一 pane 不应存在两个等待者，出现即说明上一轮异常收尾，先结算掉
  finishWait(key, 'aborted');

  return new Promise<WaitOutcome>(resolve => {
    const timer = setTimeout(() => {
      logger.warn(`[waiter:${key}] wait timeout after ${timeoutMs}ms`);
      finishWait(key, 'timeout');
    }, timeoutMs);
    waitMap.set(key, { resolve, timer });

    // 客户端断开时中止等待；正常收尾同样会触发 close，
    // 故比对当前等待者身份，保证只中止自己这一轮
    options?.onConnectionClose?.(() => {
      if (waitMap.get(key)?.resolve === resolve) {
        logger.debug(`[waiter:${key}] aborted by connection close`);
        finishWait(key, 'aborted');
      }
    });
  });
};

/**
 * 结算指定 pane 的等待（Claude Stop 到达时调用）
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane index
 * @returns 是否命中等待项
 */
export const settleWait = (session: string, window: string, paneIndex: number): boolean => {
  const key = buildPaneKey(session, window, paneIndex);
  const isSettled = finishWait(key, 'completed');
  logger.debug(`[waiter:${key}] settleWait settled=${isSettled}`);
  return isSettled;
};

/** 清理全部等待项（daemon 停止时释放内存与定时器） */
export const clearWaits = (): void => {
  for (const waiter of waitMap.values()) {
    clearTimeout(waiter.timer);
    waiter.resolve('aborted');
  }
  waitMap.clear();
};
