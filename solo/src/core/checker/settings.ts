import { existsSync } from 'fs';
import { CONFIG_PATH } from '../../config';
import type { SettingsCheckResult } from './types';

export const checkSettings = (): SettingsCheckResult => {
  return {
    exists: existsSync(CONFIG_PATH),
    path: CONFIG_PATH
  };
};
