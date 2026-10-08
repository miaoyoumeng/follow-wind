import { execa } from 'execa';

/**
 * 在 session 中创建新 window
 * @param session session 名称
 * @param window window 名称
 * @param dir 工作目录，省略时使用当前进程工作目录
 */
export const createTmuxWindow = async (session: string, window: string, dir?: string): Promise<void> => {
  const path = dir ?? process.cwd();
  await execa('tmux', ['new-window', '-t', session, '-n', window, '-c', path]);
};
