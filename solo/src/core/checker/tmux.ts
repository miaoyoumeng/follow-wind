import { exec } from 'child_process';
import { promisify } from 'util';
import type { TmuxCheckResult } from './types';

const execAsync = promisify(exec);

export const checkTmux = async (): Promise<TmuxCheckResult> => {
  try {
    const { stdout } = await execAsync('tmux -V');
    return { installed: true, version: stdout.trim() };
  } catch {
    return { installed: false };
  }
};
