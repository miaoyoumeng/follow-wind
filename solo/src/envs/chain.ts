import type { EnvHandler, EnvCheckResult } from './types';

/**
 * 执行责任链，合并所有 handler 的结果
 * @param firstHandler 链的第一个 handler
 * @returns 合并后的检测结果
 */
export const runEnvHandlers = async (firstHandler: EnvHandler): Promise<EnvCheckResult> => {
  const result: EnvCheckResult = {};
  let current: EnvHandler | null = firstHandler;

  while (current) {
    const handlerResult = await current.handle();
    Object.assign(result, handlerResult);
    current = current.getNext();
  }

  return result;
};
