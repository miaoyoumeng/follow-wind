import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 SessionEnd 事件处理器
 * @returns SessionEnd 事件处理器
 */
export const createSessionEndProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[SessionEndProcessor] processing SessionEnd event');
  }
});
