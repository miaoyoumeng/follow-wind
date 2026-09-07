import { sendKeys, capturePane } from '../tmux';
import { delay } from './delay';

/**
 * 检测 pane 中是否出现 claude 的安全信任提示，若是则发送 Enter 自动信任该工作目录
 */
export const trustFolder = async (target: string): Promise<void> => {
  const content = await capturePane(target);
  if (content.includes('Security guide')) {
    await sendKeys(target, 'Enter');
  }
};

/**
 * 在指定 pane 中启动 claude 并自动处理信任提示
 * @param target pane 定位，形如 sessionName:windowName.paneIndex
 */
export const startClaude = async (target: string): Promise<void> => {
  await sendKeys(target, 'claude');
  await sendKeys(target, 'Enter');
  await delay(5000);
  await trustFolder(target);
};
