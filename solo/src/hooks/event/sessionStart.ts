import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 SessionStart 事件处理器
 * @returns SessionStart 事件处理器
 */
export const createSessionStartProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[SessionStartProcessor] processing SessionStart event');
  }
});
