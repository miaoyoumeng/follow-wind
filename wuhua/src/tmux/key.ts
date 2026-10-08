/**
 * 拼接 tmux pane 坐标为存储 key
 * @param session tmux session 名称
 * @param window tmux window 名称
 * @param paneIndex tmux pane 索引
 * @returns 格式 `${session}:${window}.${paneIndex}`
 */
export const buildPaneKey = (session: string, window: string, paneIndex: number): string =>
  `${session}:${window}.${paneIndex}`;
