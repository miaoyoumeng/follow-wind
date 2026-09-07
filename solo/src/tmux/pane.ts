import { exec } from './exec';

/**
 * 在 window 内分屏，返回新 pane 的 index
 */
export const splitWindow = async (sessionName: string, windowName: string, orientation: '-h' | '-v', dir?: string): Promise<number> => {
  const cwd = dir ? ` -c ${dir}` : '';
  const { stdout } = await exec.fn(`tmux split-window -t ${sessionName}:${windowName} ${orientation}${cwd} -P -F '#{pane_index}'`);
  return parseInt(stdout.trim(), 10);
};

/**
 * 在指定 pane 上分屏，返回新 pane 的 index
 */
export const splitPane = async (target: string, orientation: '-h' | '-v', dir?: string): Promise<number> => {
  const cwd = dir ? ` -c ${dir}` : '';
  const { stdout } = await exec.fn(`tmux split-window -t ${target} ${orientation}${cwd} -P -F '#{pane_index}'`);
  return parseInt(stdout.trim(), 10);
};

/**
 * 获取 window 中所有 pane 的 index
 */
export const listPanes = async (sessionName: string, windowName: string): Promise<number[]> => {
  const { stdout } = await exec.fn(`tmux list-panes -t ${sessionName}:${windowName} -F '#{pane_index}'`);
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => parseInt(line, 10));
};

/**
 * 设置 pane 标题
 */
export const setPaneTitle = async (target: string, title: string): Promise<void> => {
  await exec.fn(`tmux select-pane -t ${target} -T '${title}'`);
};

/**
 * 向 pane 发送按键序列
 * @param keys tmux 键名（如 'Enter'、'C-m'）不加引号，文本内容（含空格或特殊字符）加引号
 */
export const sendKeys = async (target: string, keys: string): Promise<void> => {
  const keysArg = /^[a-zA-Z0-9-]+$/.test(keys) ? keys : `'${keys}'`;
  await exec.fn(`tmux send-keys -t ${target} ${keysArg}`);
};

/**
 * 捕获 pane 当前可见内容
 */
export const capturePane = async (target: string): Promise<string> => {
  const { stdout } = await exec.fn(`tmux capture-pane -t ${target} -p`);
  return stdout;
};
