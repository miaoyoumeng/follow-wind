import { execAsync } from '../process';
import { logger } from '../logging';

/**
 * 判断 tmux server 是否运行中
 * @returns tmux server 运行中返回 true，否则返回 false
 */
export const isTmuxRunning = async (): Promise<boolean> => {
  try {
    await execAsync('tmux list-sessions 2>/dev/null');
    return true;
  } catch {
    return false;
  }
};

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
  const cwd = dir ?? process.cwd();
  await execAsync(`tmux new-session -d -s ${name} -c ${cwd}`);
};

/**
 * 终止 session
 */
export const killSession = async (name: string): Promise<void> => {
  try {
    await execAsync(`tmux kill-session -t ${name}`);
  } catch {
    logger.warn(`⚠️ session ${name} 不存在或已终止`);
  }
};
