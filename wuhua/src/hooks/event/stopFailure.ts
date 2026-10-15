import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';
import { ipcPaneFailure } from '../../ipc';

/**
 * 创建 StopFailure 事件处理器
 * Claude 因 API 错误结束回合时，把对应 pane 置为 error
 * @returns StopFailure 事件处理器
 */
export const createStopFailureProcessor = (): EventProcessor => ({
  process: async (context: ProcessorContext): Promise<void> => {
    const { session, window, paneIndex, stdinData } = context;

    if (!session || window === undefined || paneIndex === undefined) {
      logger.debug('[StopFailureProcessor] tmux 上下文不完整，跳过 pane 状态上报');
      return;
    }

    logger.warn(
      `[StopFailureProcessor] StopFailure on ${session}:${window}.${paneIndex}, stdin=${JSON.stringify(stdinData)}`
    );

    try {
      logger.debug(`[StopFailureProcessor] invoking ipcPaneFailure for ${session}:${window}.${paneIndex}`);
      await ipcPaneFailure(session, window, paneIndex);
      logger.info(`[StopFailureProcessor] pane marked as error`);
    } catch (err) {
      logger.warn(`[StopFailureProcessor] Failed to report pane failure: ${String(err)}`);
    }
  }
});
