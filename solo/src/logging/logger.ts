/**
 * tslog 封装：提供文件日志输出
 */
import { Logger, type ILogObjMeta } from 'tslog';
import { formatLocalReadable } from '../utils/times';
import { writeFile, appendFile } from '../utils/files';
import type { LoggingConfig } from '../config/yaml/types';
import { readConfig } from '../config';

let logger: Logger<ILogObjMeta> | null = null;

/**
 * 初始化日志模块
 * @param config 日志配置：level 为日志级别，file 为日志文件路径
 */
export const setup = (config: LoggingConfig): void => {
  writeFile(config.file, '');

  const levelToMinLevel: Record<string, number> = {
    debug: 2,
    info: 3,
    warn: 4,
    error: 5
  };

  logger = new Logger({
    minLevel: levelToMinLevel[config.level] ?? 2,
    type: 'hidden'
  });

  logger.attachTransport((record: ILogObjMeta & Record<string, unknown>) => {
    const level = record._logMeta?.logLevelName ?? 'INFO';
    const msg = record[0] ?? '';
    appendFile(config.file, `[${formatLocalReadable()}] [${level}] ${msg}\n`);
  });
};

export const debug = (message: string): void => {
  logger?.debug(message);
};

export const info = (message: string): void => {
  logger?.info(message);
};

export const warn = (message: string): void => {
  logger?.warn(message);
};

export const error = (message: string): void => {
  logger?.error(message);
};

/**
 * 从 .solo/config 读取日志配置
 * @returns 日志配置对象，未配置时返回 null
 */
export const getLoggingConfig = (): LoggingConfig | null => {
  const config = readConfig();
  return config.logging ?? null;
};
