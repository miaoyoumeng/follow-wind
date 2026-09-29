import type { ClaudeHookEvent, EventProcessor } from './types';
import { createSessionStartProcessor } from './sessionStart';
import { createSessionEndProcessor } from './sessionEnd';
import { createStopProcessor } from './stop';
import { createStopFailureProcessor } from './stopFailure';
import { createPreToolUseProcessor } from './preToolUse';
import { createPostToolUseProcessor } from './postToolUse';
import { createPostToolUseFailureProcessor } from './postToolUseFailure';
import { createPermissionRequestProcessor } from './permissionRequest';
import { createPermissionDeniedProcessor } from './permissionDenied';
import { createDefaultClaudeHookEvent } from './defaultClaudeHookEvent';
import { logger } from '../../logging';

/**
 * 根据事件名称创建对应的处理器
 * @param event Claude Hook 事件名称
 * @returns 事件处理器
 */
export const createProcessor = (event: ClaudeHookEvent): EventProcessor => {
  switch (event) {
    case 'SessionStart':
      return createSessionStartProcessor();
    case 'SessionEnd':
      return createSessionEndProcessor();
    case 'Stop':
      return createStopProcessor();
    case 'StopFailure':
      return createStopFailureProcessor();
    case 'PreToolUse':
      return createPreToolUseProcessor();
    case 'PostToolUse':
      return createPostToolUseProcessor();
    case 'PostToolUseFailure':
      return createPostToolUseFailureProcessor();
    case 'PermissionRequest':
      return createPermissionRequestProcessor();
    case 'PermissionDenied':
      return createPermissionDeniedProcessor();
    default:
      logger.warn(`claude hook event unknown type: ${String(event)}`);
      return createDefaultClaudeHookEvent();
  }
};
