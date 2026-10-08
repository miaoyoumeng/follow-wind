import type { EventProcessor, ProcessorContext } from './types';
import { logger } from '../../logging';

/**
 * 创建仅记录日志的无操作事件处理器
 * @param name 事件名称
 * @returns 事件处理器
 */
export const createNoopProcessor = (name: string): EventProcessor => ({
  process: async (_context: ProcessorContext): Promise<void> => {
    logger.warn(`claude hook event unknown type: ${name}`);
  }
});
