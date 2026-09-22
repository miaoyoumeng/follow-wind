import chalk from 'chalk';
import { capturePane } from '../tmux';
import { getAgent } from '../agents';
import { CAPTURE_DIR } from '../config/paths';
import { logger } from '../logging';
import { validateWorkspace } from './status';
import { ensureDir, writeFile, stat } from '../utils';

const COOLDOWN_MS = 30_000;

/**
 * 捕获指定 agent 的 pane 内容，覆盖写入 .solo/capture/[agentName]-[paneIndex].md
 * 若距上次写入不足 30 秒，输出提示并终止
 * @param agentName agent 名称
 * @param paneIndex pane 索引
 */
export const runCapture = async (agentName: string, paneIndex: number): Promise<void> => {
  const sessionName = validateWorkspace();
  const agent = getAgent(agentName);
  if (!agent) throw new Error(`agent "${agentName}" 不存在`);

  const filePath = `${CAPTURE_DIR}/${agentName}-${paneIndex}.md`;

  try {
    const fileStat = stat(filePath);
    const elapsed = Date.now() - fileStat.mtimeMs;
    if (elapsed < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      const message = `截屏间隔时间少于30秒，继续等待${waitSeconds}秒`;
      console.log(chalk.yellow(message));
      logger.info(message);
      return;
    }
  } catch {
    // 文件不存在，继续捕获
  }

  const content = await capturePane(sessionName, agentName, paneIndex);
  ensureDir(CAPTURE_DIR);
  writeFile(filePath, content);
};
