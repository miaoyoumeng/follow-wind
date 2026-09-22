/**
 * tslog 封装：Logger 类提供 trace/debug/info/warn/error 五级日志
 */
import { Logger as TsLog, type ILogObjMeta } from 'tslog';
import { formatLocalReadable, appendFile } from '../utils';
import type { LoggingConfig } from '../config/yaml/types';
import { readConfig, resolveLoggingConfig } from '../config';

/** tslog minLevel 映射 */
const LEVEL_TO_MIN_LEVEL: Record<string, number> = {
  silly: 0,
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6
};

/**
 * Logger 类：封装 tslog，提供文件日志
 */
export class Logger {
  private _tslog: TsLog<ILogObjMeta> | null = null;
  private _file = '';
  private _minLevel = Infinity;

  /**
   * 初始化日志模块（创建 tslog 实例、注册 transport，日志追加写入文件）
   * @param config 日志配置：level 为日志级别，file 为日志文件路径
   */
  configure(config: Required<LoggingConfig>): void {
    this._file = config.file;
    this._minLevel = LEVEL_TO_MIN_LEVEL[config.level] ?? 2;
    this._tslog = new TsLog({
      minLevel: this._minLevel,
      type: 'hidden'
    });

    this._tslog.attachTransport((record: ILogObjMeta & Record<string, unknown>) => {
      const level = record._logMeta?.logLevelName ?? 'INFO';
      const msg = record[0] ?? '';
      appendFile(this._file, `[${formatLocalReadable()}] [${level}] ${String(msg)}\n`);
    });
  }

  /**
   * 输出 trace 级别日志（仅当 minLevel ≤ 1 时可见）
   * @param message 日志消息
   */
  trace(message: string): void {
    this._tslog?.trace(message);
  }

  /**
   * 输出 debug 级别日志
   * @param message 日志消息
   */
  debug(message: string): void {
    this._tslog?.debug(message);
  }

  /**
   * 输出 info 级别日志
   * @param message 日志消息
   */
  info(message: string): void {
    this._tslog?.info(message);
  }

  /**
   * 输出 warn 级别日志
   * @param message 日志消息
   */
  warn(message: string): void {
    this._tslog?.warn(message);
  }

  /**
   * 输出 error 级别日志
   * @param message 日志消息
   */
  error(message: string): void {
    this._tslog?.error(message);
  }

  /**
   * 判断 trace 级别日志是否启用（minLevel ≤ 1）
   * @returns 当前配置是否允许输出 trace 日志
   */
  isTraceEnabled(): boolean {
    return this._minLevel <= 1;
  }

  /**
   * 判断 debug 级别日志是否启用（minLevel ≤ 2）
   * @returns 当前配置是否允许输出 debug 日志
   */
  isDebugEnabled(): boolean {
    return this._minLevel <= 2;
  }

  /**
   * 判断 info 级别日志是否启用（minLevel ≤ 3）
   * @returns 当前配置是否允许输出 info 日志
   */
  isInfoEnabled(): boolean {
    return this._minLevel <= 3;
  }
}

/** 模块级默认 logger 实例 */
export const logger = new Logger();

/**
 * 配置默认 logger 实例（供 initLogger 调用）
 * @param config 日志配置
 */
export const setup = (config: Required<LoggingConfig>): void => {
  logger.configure(config);
};

/**
 * 从 .solo/config 读取日志配置，缺失字段补充默认值（level → warn，file → .solo/solo.log）
 * @returns 完整的日志配置对象（始终有值）
 */
export const getLoggingConfig = (): Required<LoggingConfig> => {
  const config = readConfig();
  return resolveLoggingConfig(config.logging);
};
