import { sendKeys, waitForText } from '../tmux';

/**
 * 解析 tmux target 字符串（格式：session:window.paneIndex）
 */
const parseTarget = (target: string): { session: string; window: string; paneIndex: number } => {
  const colonIdx = target.indexOf(':');
  const session = target.slice(0, colonIdx);
  const rest = target.slice(colonIdx + 1);
  const dotIdx = rest.lastIndexOf('.');
  return { session, window: rest.slice(0, dotIdx), paneIndex: parseInt(rest.slice(dotIdx + 1), 10) };
};

/**
 * 等待 pane 中出现 claude 安全信任提示，出现则发送 Enter 自动信任
 * 等待 10 秒，每 1 秒轮询一次，取最近 2000 行内容
 *
 * @param target tmux target（格式：session:window.paneIndex）
 */
export const trustFolder = async (target: string): Promise<void> => {
  const { session, window, paneIndex } = parseTarget(target);
  try {
    await waitForText(session, window, paneIndex, 'Security guide', 'Security guide', 10000, 1000, 2000);
    await sendKeys(session, window, paneIndex, 'Enter');
  } catch {
    // 未检测到信任提示，无需操作
  }
};
