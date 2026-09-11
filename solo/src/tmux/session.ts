import chalk from 'chalk';

import { execAsync } from '../process';
import type { CurrentSessionInfo } from './types';

/**
 * 检查 session 是否存在
 */
export const sessionExists = async (name: string): Promise<boolean> => {
  try {
    await execAsync(`tmux has-session -t ${name} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
};

/**
 * 创建新的 session
 */
export const createSession = async (name: string, dir?: string): Promise<void> => {
  const cwd = dir || process.cwd();
  await execAsync(`tmux new-session -d -s ${name} -c ${cwd}`);
};

/**
 * 终止 session
 */
export const killSession = async (name: string): Promise<void> => {
  try {
    await execAsync(`tmux kill-session -t ${name}`);
  } catch {
    console.log(chalk.yellow(`⚠️ session ${name} 不存在或已终止`));
  }
};

/**
 * 附加到 session
 */
export const attachSession = async (name: string): Promise<void> => {
  await execAsync(`tmux attach-session -t ${name}`);
};

/**
 * 获取当前 session 信息
 */
export const getCurrentSession = async (): Promise<CurrentSessionInfo | null> => {
  try {
    const { stdout } = await execAsync('tmux display-message -p "#{session_id}\\t#{session_name}"');
    const [id, name] = stdout.trim().split('\t');
    return { id, name };
  } catch {
    return null;
  }
};
