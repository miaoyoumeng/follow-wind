import { getSessionName, getWindowName, getPaneIndex, getPaneName, type HookCallbackParams } from '../tmux';
import type { TmuxHook } from './types';
import { readConfig } from '../config';
import { nowUTC } from '../utils/times';
import { logger } from '../logging';

/**
 * 构造 TmuxHook 对象
 * @param params hook 回调参数（endpoint=tmux）
 * @returns TmuxHook 实例，name 对应 params.event；sessionName/windowName/paneIndex 在 runner() 执行后由 display-message 填充
 */
export const createTmuxHook = (params: HookCallbackParams): TmuxHook => {
  const hook: TmuxHook = {
    name: params.event,
    type: 'tmux',
    time: nowUTC(),
    sessionName: '',
    windowName: '',
    paneIndex: '',
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
      hook.sessionName = session;
      hook.windowName = window;
      hook.paneIndex = String(paneIdx);
    }
  };
  return hook;
};
