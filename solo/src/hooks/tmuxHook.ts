import { getSessionName, getWindowName, getPaneIndex, getPaneName, type HookCallbackParams } from '../tmux';
import type { TmuxHook } from './types';
import { readConfig } from '../config';
import { nowUTC } from '../utils/times';
import { logger } from '../logging';

/**
 * 构造 TmuxHook 对象
 * @param params hook 回调参数（endpoint=tmux）
 * @returns TmuxHook 实例，name 对应 params.event
 */
export const createTmuxHook = (params: HookCallbackParams): TmuxHook => ({
  name: params.event,
  type: 'tmux',
  time: nowUTC(),
  runner: async () => {
    const [session, window, paneIdx, paneName] = await Promise.all([
      getSessionName(),
      getWindowName(),
      getPaneIndex(),
      getPaneName()
    ]);
    const currentSession = readConfig().name;
    if (session !== currentSession) {
      return;
    }
    logger.debug(
      `[tmuxHook] display-message: session=${session}, window=${window}, paneIndex=${paneIdx}, paneName=${paneName}`
    );
  }
});
