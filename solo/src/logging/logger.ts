import { appendFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { LoggingConfig } from './types';

const LEVEL_PRIORITY = { debug: 0, info: 1, warn: 2, error: 3 } as const;

let currentLevel: keyof typeof LEVEL_PRIORITY | null = null;
let currentFile: string | null = null;

const formatTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const write = (level: keyof typeof LEVEL_PRIORITY, message: string): void => {
  if (!currentLevel || !currentFile) return;
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[currentLevel]) return;
  appendFileSync(currentFile, `[${formatTimestamp()}] [${level.toUpperCase()}] ${message}\n`);
};

/**
 * 初始化日志模块
 * @param config 日志配置：level 为日志级别，file 为日志文件路径
 */
export const setup = (config: LoggingConfig): void => {
  currentLevel = config.level;
  currentFile = config.file;
  mkdirSync(dirname(currentFile), { recursive: true });
  writeFileSync(currentFile, '');
};

/** 重置日志模块状态（用于测试） */
export const reset = (): void => {
  currentLevel = null;
  currentFile = null;
};

export const debug = (message: string): void => write('debug', message);
export const info = (message: string): void => write('info', message);
export const warn = (message: string): void => write('warn', message);
export const error = (message: string): void => write('error', message);
