import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 PreToolUse 事件处理器
 * @returns PreToolUse 事件处理器
 */
export const createPreToolUseProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[PreToolUseProcessor] processing PreToolUse event');
  }
});
