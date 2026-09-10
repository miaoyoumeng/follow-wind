import { SettingsHandler } from './settings';
import { ClaudeHandler } from './claude';
import { TmuxHandler } from './tmux';

export { BaseEnvHandler } from './base';
export { runEnvHandlers } from './chain';
export { SettingsHandler } from './settings';
export { ClaudeHandler } from './claude';
export { TmuxHandler } from './tmux';
export type { EnvHandler, EnvCheckResult, SettingsCheckResult, CheckResult, TmuxCheckResult } from './types';

// 向后兼容的便捷函数
export const checkSettings = (): { exists: boolean; path: string } => {
  const handler = new SettingsHandler();
  const result = handler.handle();
  return (result as { settings: { exists: boolean; path: string } }).settings;
};

export const checkClaude = async (): Promise<{ installed: boolean; version?: string }> => {
  const handler = new ClaudeHandler();
  const result = await handler.handle();
  return result.claude!;
};

export const checkTmux = async (): Promise<{ installed: boolean; version?: string }> => {
  const handler = new TmuxHandler();
  const result = await handler.handle();
  return result.tmux!;
};
