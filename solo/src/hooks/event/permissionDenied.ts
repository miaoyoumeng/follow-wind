import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 PermissionDenied 事件处理器
 * @returns PermissionDenied 事件处理器
 */
export const createPermissionDeniedProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[PermissionDeniedProcessor] processing PermissionDenied event');
  }
});
