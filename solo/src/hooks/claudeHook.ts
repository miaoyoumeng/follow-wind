import {
  isTmuxRunning,
  getSessionName,
  getWindowName,
  getPaneIndex,
  getPaneName,
  type HookCallbackParams
} from '../tmux';
import type { ClaudeHook } from './types';
import { logger } from '../logging';
import { nowUTC } from '../utils/times';
import { readStdin } from '../utils/files';
import { createProcessor, isClaudeHookEvent, type ProcessorContext } from './event';

/**
 * 构造 ClaudeHook 对象
 * @param params hook 回调参数（endpoint=claude）
 * @returns ClaudeHook 实例，name 对应 params.event
 */
export const createClaudeHook = (params: HookCallbackParams): ClaudeHook => ({
  name: params.event,
  type: 'claude',
  time: nowUTC(),
  workspace: params.workspace ?? '',
  runner: async (): Promise<void> => {
    let session: string | undefined;
    let window: string | undefined;
    let paneIdx: number | undefined;

    if (await isTmuxRunning()) {
      [session, window, paneIdx] = await Promise.all([getSessionName(), getWindowName(), getPaneIndex()]);
      const paneName = await getPaneName();
      logger.debug(
        `[claudeHook] display-message: session=${session}, window=${window}, paneIndex=${paneIdx}, paneName=${paneName}`
      );
    }

    const input = await readStdin();
    const parsed = JSON.parse(input) as { hook_event_name?: string; tool_name?: string; tool_input?: unknown };
    logger.debug(`[claudeHook] hook_event_name=${parsed.hook_event_name ?? ''}, tool_name=${parsed.tool_name ?? ''}`);

    const eventName = parsed.hook_event_name;
    if (!eventName || !isClaudeHookEvent(eventName)) {
      logger.warn(`[claudeHook] hook_event_name= ${eventName}`);
      return;
    }
    const context: ProcessorContext = {
      session,
      window,
      paneIndex: paneIdx,
      stdinData: parsed,
      workspace: params.workspace ?? ''
    };
    const processor = createProcessor(eventName);
    await processor.process(context);
  }
});
