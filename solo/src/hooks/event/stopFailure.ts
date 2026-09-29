import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 StopFailure 事件处理器
 * @returns StopFailure 事件处理器
 */
export const createStopFailureProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[StopFailureProcessor] processing StopFailure event');
  }
});
