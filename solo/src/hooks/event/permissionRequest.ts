import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建 PermissionRequest 事件处理器
 * @returns PermissionRequest 事件处理器
 */
export const createPermissionRequestProcessor = (): EventProcessor => ({
  process: async (_context: ProcessorContext) => {
    logger.debug('[PermissionRequestProcessor] processing PermissionRequest event');
  }
});
