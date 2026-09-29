import { exec } from '../process';
// tmux display-message -ap

/**
 * 获取当前 tmux session 名称
 * tmux display-message -p '#{session_name}'
 * @returns session 名称字符串
 */
export const getSessionName = async (): Promise<string> => {
  const { stdout } = await exec.fn("tmux display-message -p '#S'");
  return stdout.trim();
};

/**
 * 获取当前 tmux window 名称
 * tmux display-message -p '#{window_name}'
 * @returns window 名称字符串
 */
export const getWindowName = async (): Promise<string> => {
  const { stdout } = await exec.fn("tmux display-message -p '#W'");
  return stdout.trim();
};

/**
 * 获取当前 tmux pane 索引
 * tmux display-message -p '#{pane_index}'
 * @returns pane 索引（number）
 */
export const getPaneIndex = async (): Promise<number> => {
  const { stdout } = await exec.fn("tmux display-message -p '#P'");
  return parseInt(stdout.trim(), 10);
};

/**
 * 获取当前 tmux pane 标题（pane name）
 * tmux display-message -p '#{pane_title}'
 * @returns pane 标题字符串
 */
export const getPaneName = async (): Promise<string> => {
  const { stdout } = await exec.fn("tmux display-message -p '#T'");
  return stdout.trim();
};
