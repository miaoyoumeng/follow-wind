import { execAsync } from '../process';
import type { TmuxCheckResult } from './types';

export const checkTmux = async (): Promise<TmuxCheckResult> => {
  try {
    const { stdout } = await execAsync('tmux -V');
    return { installed: true, version: stdout.trim() };
  } catch {
    return { installed: false };
  }
};
