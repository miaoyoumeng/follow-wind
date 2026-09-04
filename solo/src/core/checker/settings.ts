import { existsSync } from 'fs';
import { CONFIG_PATH } from '../../config';

export function checkSettings(): { exists: boolean; path: string } {
  return {
    exists: existsSync(CONFIG_PATH),
    path: CONFIG_PATH
  };
}
