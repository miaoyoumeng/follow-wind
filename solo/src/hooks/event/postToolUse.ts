import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 PostToolUse 事件处理器
 * @returns PostToolUse 事件处理器
 */
export const createPostToolUseProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[PostToolUseProcessor] processing PostToolUse event');
  }
});
