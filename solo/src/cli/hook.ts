import { isTmuxHook } from '../tmux';
import type { HookCallbackParams } from '../tmux';
import { logger } from '../logging';
import { createTmuxHook, createClaudeHook } from '../hooks';

const VALID_ENDPOINTS: readonly string[] = ['tmux', 'claude'];

/**
 * 处理 hook 回调：
 * 1. 校验 endpoint 合法性
 * 2. 构造对应的 hook 对象并执行 runner()
 * @param params hook 回调参数
 */
export const runHook = async (params: HookCallbackParams): Promise<void> => {
  if (!VALID_ENDPOINTS.includes(params.endpoint)) {
    logger.warn(`[hook] 未知 endpoint "${params.endpoint}"（必须是 tmux 或 claude）`);
    return;
  }
  let hook = null;
  if (params.endpoint === 'tmux') {
    if (!isTmuxHook(params.event)) {
      logger.warn(`[hook] 未知 hook 事件 "${params.event}"（不在 tmux hook 池中）`);
      throw new Error(`未知 hook 事件 "${params.event}"（不在 tmux hook 池中）`);
    }
    hook = createTmuxHook(params);
  } else {
    hook = createClaudeHook(params);
  }
  await hook?.runner();
};
