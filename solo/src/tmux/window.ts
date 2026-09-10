import { execAsync } from '../process';
import type { WindowInfo } from './types';

/**
 * 在 session 中创建新 window
 */
export const createWindow = async (session: string, window: string, dir?: string): Promise<void> => {
  const path = dir ?? process.cwd();
  await execAsync(`tmux new-window -t ${session} -n ${window} -c ${path}`);
};

/**
 * 获取 session 中所有 window 信息
 */
export const listWindows = async (session: string): Promise<WindowInfo[]> => {
  try {
    const { stdout } = await execAsync(`tmux list-windows -t ${session} -F $'#{window_name}\\t#{window_panes}'`);
    return stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [name, panes] = line.split('\t');
        return { name, panes: parseInt(panes, 10) };
      });
  } catch {
    return [];
  }
};
