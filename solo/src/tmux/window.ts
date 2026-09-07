import { exec } from 'child_process';
import { promisify } from 'util';
import type { WindowInfo } from './types';

const execAsync = promisify(exec);

/**
 * 在 session 中创建新 window
 */
export const createWindow = async (sessionName: string, windowName: string, dir?: string): Promise<void> => {
  const path = dir ?? process.cwd();
  console.log(`===path: ${path}`);
  await execAsync(`tmux new-window -t ${sessionName} -n ${windowName} -c ${path}`);
};

/**
 * 获取 session 中所有 window 信息
 */
export const listWindows = async (sessionName: string): Promise<WindowInfo[]> => {
  try {
    const { stdout } = await execAsync(`tmux list-windows -t ${sessionName} -F $'#{window_name}\\t#{window_panes}'`);
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
