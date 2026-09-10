import { CONFIG_PATH } from '../config';
import { BaseEnvHandler } from './base';
import { exists } from '../utils/files';
import type { EnvCheckResult } from './types';

/**
 * Settings 环境检测 Handler
 */
export class SettingsHandler extends BaseEnvHandler {
  handle(): EnvCheckResult {
    return {
      settings: {
        exists: exists(CONFIG_PATH),
        path: CONFIG_PATH
      }
    };
  }
}
