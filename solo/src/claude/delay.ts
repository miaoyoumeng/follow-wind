/**
 * 等待指定毫秒
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
