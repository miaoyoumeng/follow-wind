import { exec } from './exec';

/**
 * 在指定 pane 上分屏，返回新 pane 的 index
 */
export const splitPane = async (session: string, window: string, paneIndex: number, orientation: '-h' | '-v', dir?: string): Promise<number> => {
  const target = `${session}:${window}.${paneIndex}`;
  const cwd = dir ? ` -c ${dir}` : '';
  const { stdout } = await exec.fn(`tmux split-window -t ${target} ${orientation}${cwd} -P -F '#{pane_index}'`);
  return parseInt(stdout.trim(), 10);
};

/**
 * 获取 window 中所有 pane 的 index
 */
export const listPanes = async (session: string, window: string): Promise<number[]> => {
  const { stdout } = await exec.fn(`tmux list-panes -t ${session}:${window} -F '#{pane_index}'`);
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => parseInt(line, 10));
};

/**
 * 获取 window 中所有 pane 的 index 和 title
 */
export const listPanesWithTitle = async (session: string, window: string): Promise<Array<{ index: number; title: string }>> => {
  const { stdout } = await exec.fn(`tmux list-panes -t ${session}:${window} -F '#{pane_index} #{pane_title}'`);
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const spaceIdx = line.indexOf(' ');
      const index = parseInt(line.substring(0, spaceIdx), 10);
      const title = spaceIdx >= 0 ? line.substring(spaceIdx + 1) : '';
      return { index, title };
    });
};

/**
 * 设置 pane 标题
 */
export const setPaneTitle = async (session: string, window: string, paneIndex: number, title: string): Promise<void> => {
  const target = `${session}:${window}.${paneIndex}`;
  await exec.fn(`tmux select-pane -t ${target} -T '${title}'`);
};

/**
 * 选择（激活）指定 pane
 */
export const selectPane = async (session: string, window: string, paneIndex: number): Promise<void> => {
  const target = `${session}:${window}.${paneIndex}`;
  await exec.fn(`tmux select-pane -t ${target}`);
};

/**
 * 向 pane 发送按键序列
 * @param session
 * @param window
 * @param paneIndex
 * @param keys tmux 键名（如 'Enter'、'C-m'）不加引号，文本内容（含空格或特殊字符）加引号
 */
export const sendKeys = async (session: string, window: string, paneIndex: number, keys: string): Promise<void> => {
  const target = `${session}:${window}.${paneIndex}`;
  const keysArg = /^[a-zA-Z0-9-]+$/.test(keys) ? keys : `'${keys.replace(/'/g, `'\\''`)}'`;
  await exec.fn(`tmux send-keys -t ${target} ${keysArg}`);
};

/**
 * 向 pane 发送按键序列并追加 Enter
 * @param session
 * @param window
 * @param paneIndex
 * @param keys tmux 键名（如 'C-c'）不加引号，文本内容（含空格或特殊字符）加引号
 */
export const sendKeysEnter = async (session: string, window: string, paneIndex: number, keys: string): Promise<void> => {
  const target = `${session}:${window}.${paneIndex}`;
  const keysArg = /^[a-zA-Z0-9-]+$/.test(keys) ? keys : `'${keys.replace(/'/g, `'\\''`)}'`;
  await exec.fn(`tmux send-keys -t ${target} ${keysArg} Enter`);
};

/**
 * 捕获 pane 内容，可选取最近 N 行并合并换行包裹
 */
export const capturePane = async (session: string, window: string, paneIndex: number, lines?: number, joinWrapped?: boolean): Promise<string> => {
  const target = `${session}:${window}.${paneIndex}`;
  let cmd = `tmux capture-pane -t ${target} -p`;
  if (lines !== undefined) cmd += ` -S -${lines}`;
  if (joinWrapped) cmd += ' -J';
  const { stdout } = await exec.fn(cmd);
  return stdout;
};

/**
 * 轮询 pane 内容，等待匹配 pattern 的文本出现或超时
 * @param session
 * @param window
 * @param paneIndex
 * @param pattern
 * @param fixed 非空字符串按固定字符串匹配，空字符串按正则匹配
 * @param timeout
 * @param interval
 * @param lines
 */
export const waitForText = async (
  session: string,
  window: string,
  paneIndex: number,
  pattern: string,
  fixed: string,
  timeout: number,
  interval: number,
  lines: number
): Promise<void> => {
  const deadline = Date.now() + timeout;
  while (true) {
    const content = await capturePane(session, window, paneIndex, lines, true);
    const matched = fixed ? content.includes(fixed) : new RegExp(pattern).test(content);
    if (matched) return;
    if (Date.now() >= deadline) {
      throw new Error(`Timed out after ${timeout}ms waiting for pattern: ${pattern}`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

/**
 * 通知 agent-tracker 指定 pane 中的任务已完成
 * 先获取 pane 当前运行的命令名，再调用 agent-tracker 发送通知
 * 任何步骤失败均静默返回，不抛出错误
 */
export const notifyCompletion = async (session: string, window: string, paneIndex: string): Promise<void> => {
  const target = `${session}:${window}.${paneIndex}`;
  try {
    const { stdout } = await exec.fn(`tmux display-message -p -t ${target} '#{pane_current_command}'`);
    const currentCmd = stdout.trim();
    const tracker = `${process.env.HOME}/.config/agent-tracker/bin/agent`;
    const message = `${currentCmd} finished`;
    await exec.fn(`${tracker} tracker command -window-id ${window} -pane ${paneIndex} -summary '${message}' notify`);
  } catch {
    // 静默处理：tracker 不存在或调用失败
  }
};
