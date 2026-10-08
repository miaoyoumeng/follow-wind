import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';
import { capturePane } from '../../tmux';
import { writeFile } from '../../utils/files';
import { getTmuxPaneCapturePath } from '../../config';
import { ipcPaneRolling } from '../../ipc/client';

/**
 * 创建 Stop 事件处理器
 * @returns Stop 事件处理器
 */
export const createStopProcessor = (): EventProcessor => ({
  process: async (context: ProcessorContext): Promise<void> => {
    const { session, window, paneIndex } = context;

    if (!session || window === undefined || paneIndex === undefined) {
      logger.debug('[StopProcessor] tmux 上下文不完整，跳过截屏和 paneRolling');
      return;
    }

    logger.info(`[StopProcessor] Stop event: capturing pane ${session}:${window}.${paneIndex}`);
    const content = await capturePane(session, window, paneIndex);
    const path = getTmuxPaneCapturePath(window, paneIndex);
    writeFile(path, content);
    logger.info(`[StopProcessor] Pane captured to ${path}`);

    try {
      logger.debug(`[StopProcessor] invoking ipcPaneRolling for ${session}:${window}.${paneIndex}`);
      await ipcPaneRolling(session, window, paneIndex);
      logger.info(`[StopProcessor] Triggered daemon: paneRolling`);
    } catch (err) {
      logger.warn(`[StopProcessor] Failed to trigger paneRolling: ${String(err)}`);
    }
  }
});
