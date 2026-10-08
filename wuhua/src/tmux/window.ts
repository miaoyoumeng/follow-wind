import { execAsync } from '../process';

/**
 * 在 session 中创建新 window
 */
export const createTmuxWindow = async (session: string, window: string, dir?: string): Promise<void> => {
  const path = dir ?? process.cwd();
  await execAsync(`tmux new-window -t ${session} -n ${window} -c ${path}`);
};
