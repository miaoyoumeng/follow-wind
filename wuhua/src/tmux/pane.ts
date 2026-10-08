import { execa } from 'execa';

import { buildPaneKey } from './key';

/**
 * 在指定 pane 上分屏，返回新 pane 的 index
 * @param session session 名称
 * @param window window 名称
 * @param paneIndex 目标 pane 索引
 * @param orientation '-h' 水平分屏，'-v' 垂直分屏
 * @param dir 新 pane 的工作目录，省略则继承当前目录
 * @returns 新 pane 的 index
 */
export const splitPane = async (
  session: string,
  window: string,
  paneIndex: number,
  orientation: '-h' | '-v',
  dir?: string
): Promise<number> => {
  const target = buildPaneKey(session, window, paneIndex);
  const args = ['split-window', '-t', target, orientation];
  if (dir) {
    args.push('-c', dir);
  }
  args.push('-P', '-F', '#{pane_index}');
  const { stdout } = await execa('tmux', args);
  return parseInt(stdout.trim(), 10);
};

/**
 * 获取 window 中所有 pane 的 index
 * @param session session 名称
 * @param window window 名称
 * @returns pane index 列表
 */
export const listPanes = async (session: string, window: string): Promise<number[]> => {
  const { stdout } = await execa('tmux', ['list-panes', '-t', `${session}:${window}`, '-F', '#{pane_index}']);
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => parseInt(line, 10));
};

/**
 * 获取 window 中所有 pane 的 index 和 title
 * @param session session 名称
 * @param window window 名称
 * @returns pane 的 index 与 title 列表
 */
export const listPanesWithTitle = async (
  session: string,
  window: string
): Promise<Array<{ index: number; title: string }>> => {
  const { stdout } = await execa('tmux', [
    'list-panes',
    '-t',
    `${session}:${window}`,
    '-F',
    '#{pane_index} #{pane_title}'
  ]);
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
 * @param session session 名称
 * @param window window 名称
 * @param paneIndex 目标 pane 索引
 * @param title pane 标题
 */
export const setPaneTitle = async (
  session: string,
  window: string,
  paneIndex: number,
  title: string
): Promise<void> => {
  const target = buildPaneKey(session, window, paneIndex);
  await execa('tmux', ['select-pane', '-t', target, '-T', title]);
};

/**
 * 选择（激活）指定 pane
 * @param session session 名称
 * @param window window 名称
 * @param paneIndex 目标 pane 索引
 */
export const selectPane = async (session: string, window: string, paneIndex: number): Promise<void> => {
  const target = buildPaneKey(session, window, paneIndex);
  await execa('tmux', ['select-pane', '-t', target]);
};

/**
 * 向 pane 输入文本，默认追加 Enter 提交
 * @param session session 名称
 * @param window window 名称
 * @param paneIndex 目标 pane 索引
 * @param text 要输入的文本内容，作为单个参数原样传递，无需转义
 * @param enter 是否在文本后追加 Enter，默认 true
 */
export const sendKeys = async (
  session: string,
  window: string,
  paneIndex: number,
  text: string,
  enter: boolean = true
): Promise<void> => {
  const target = buildPaneKey(session, window, paneIndex);
  const args = ['send-keys', '-t', target, text];
  if (enter) {
    args.push('Enter');
  }
  await execa('tmux', args);
};

/**
 * 捕获 pane 内容，可选取最近 N 行并合并换行包裹
 * @param session session 名称
 * @param window window 名称
 * @param paneIndex 目标 pane 索引
 * @param lines 只捕获最近 N 行，省略则捕获全部
 * @param joinWrapped 是否合并被折行的长行
 * @returns pane 内容原文（保留末尾换行，便于直接落盘）
 */
export const capturePane = async (
  session: string,
  window: string,
  paneIndex: number,
  lines?: number,
  joinWrapped?: boolean
): Promise<string> => {
  const target = buildPaneKey(session, window, paneIndex);
  const args = ['capture-pane', '-t', target, '-p'];
  if (lines !== undefined) {
    args.push('-S', `-${lines}`);
  }
  if (joinWrapped) {
    args.push('-J');
  }
  const { stdout } = await execa('tmux', args, { stripFinalNewline: false });
  return stdout;
};
