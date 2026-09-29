import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 PostToolUseFailure 事件处理器
 * @returns PostToolUseFailure 事件处理器
 */
export const createPostToolUseFailureProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[PostToolUseFailureProcessor] processing PostToolUseFailure event');
  }
});
