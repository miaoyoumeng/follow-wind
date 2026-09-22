import { isTmuxHook, capturePane, type HookCallbackParams } from '../tmux';
import { logger } from '../logging';
import { readConfig } from '../config';
import { detectIntervention } from '../claude';

/**
 * 处理 tmux hook 回调：
 * 1. 校验事件名合法性
 * 2. 判断 session 名称是否匹配当前项目，不匹配则终止
 * 3. 记录 hook 回调参数（window 和 pane）
 * 4. 读取 pane 内容并交给策略判断
 * @param params tmux 回调参数
 * @returns 匹配的策略名称，或 null
 */
export const runHook = async (params: HookCallbackParams): Promise<string | null> => {
  if (!isTmuxHook(params.name)) {
    throw new Error(`未知 hook 事件 "${params.name}"（不在 tmux hook 池中）`);
  }

  const currentSession = readConfig().name;
  if (params.sessionName !== currentSession) {
    return null;
  }

  if (logger.isDebugEnabled()) {
    logger.debug(`[hook] ${params.name} | window=${params.windowName} pane=${params.paneIndex}`);
  }

  const paneContent = await capturePane(params.sessionName, params.windowName, Number(params.paneIndex));
  return detectIntervention({ content: paneContent });
};
