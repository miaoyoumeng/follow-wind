import { getConfigPath } from '../config';
import { BaseEnvHandler } from './base';
import { exists } from '../utils/files';
import type { EnvCheckResult } from './types';

/**
 * Settings 环境检测 Handler
 */
export class SettingsHandler extends BaseEnvHandler {
  handle(): EnvCheckResult {
    const configPath = getConfigPath();
    return {
      settings: {
        exists: exists(configPath),
        path: configPath
      }
    };
  }
}
