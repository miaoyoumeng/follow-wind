import { existsSync } from 'fs';
import { join } from 'path';

export function checkSettings(): { exists: boolean; path: string } {
  const settingsPath = join(process.cwd(), '.solo', 'config');
  return {
    exists: existsSync(settingsPath),
    path: settingsPath,
  };
}
