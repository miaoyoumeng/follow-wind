import { execa } from 'execa';

import { logger } from '../logging';

/**
 * 判断 tmux server 是否运行中
 * @returns tmux server 运行中返回 true，否则返回 false
 */
export const isTmuxRunning = async (): Promise<boolean> => {
  try {
    await execa('tmux', ['list-sessions']);
    return true;
  } catch {
    return false;
  }
};

/**
 * 检查 session 是否存在
 * @param name session 名称
 * @returns session 存在返回 true，否则返回 false
 */
export const sessionExists = async (name: string): Promise<boolean> => {
  try {
    await execa('tmux', ['has-session', '-t', name]);
    return true;
  } catch {
    return false;
  }
};

/**
 * 创建新的 session
 * @param name session 名称
 * @param dir 工作目录，省略时使用当前进程工作目录
 */
export const createSession = async (name: string, dir?: string): Promise<void> => {
  const cwd = dir ?? process.cwd();
  await execa('tmux', ['new-session', '-d', '-s', name, '-c', cwd]);
};

/**
 * 终止 session
 * @param name session 名称
 */
export const killSession = async (name: string): Promise<void> => {
  try {
    await execa('tmux', ['kill-session', '-t', name]);
  } catch {
    logger.warn(`⚠️ session ${name} 不存在或已终止`);
  }
};
