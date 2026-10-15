import type { ClaudeHookEvent, EventProcessor } from './types';
import { createStopProcessor } from './stop';
import { createStopFailureProcessor } from './stopFailure';
import { createNoopProcessor } from './noop';

/**
 * 根据事件名称创建对应的处理器
 * @param event Claude Hook 事件名称
 * @returns 事件处理器
 */
export const createProcessor = (event: ClaudeHookEvent): EventProcessor => {
  switch (event) {
    case 'SessionStart':
      return createNoopProcessor('SessionStart');
    case 'SessionEnd':
      return createNoopProcessor('SessionEnd');
    case 'Stop':
      return createStopProcessor();
    case 'StopFailure':
      return createStopFailureProcessor();
    case 'PreToolUse':
      return createNoopProcessor('PreToolUse');
    case 'PostToolUse':
      return createNoopProcessor('PostToolUse');
    case 'PostToolUseFailure':
      return createNoopProcessor('PostToolUseFailure');
    case 'PermissionRequest':
      return createNoopProcessor('PermissionRequest');
    case 'PermissionDenied':
      return createNoopProcessor('PermissionDenied');
    default:
      return createNoopProcessor('DefaultClaudeHookEvent');
  }
};
