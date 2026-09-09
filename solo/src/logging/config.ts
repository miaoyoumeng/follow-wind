import { readConfig } from '../core/yaml/writer';
import type { LoggingConfig } from './types';

/**
 * 从 .solo/config 读取日志配置
 * @returns 日志配置对象，未配置时返回 null
 */
export const getLoggingConfig = (): LoggingConfig | null => {
  const config = readConfig();
  return config.logging ?? null;
};
