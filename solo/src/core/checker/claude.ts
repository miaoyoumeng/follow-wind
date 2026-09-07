import { exec } from 'child_process';
import { promisify } from 'util';
import type { CheckResult } from './types';

const execAsync = promisify(exec);

export const checkClaude = async (): Promise<CheckResult> => {
  try {
    const { stdout } = await execAsync('claude --version');
    return { installed: true, version: stdout.trim() };
  } catch {
    return { installed: false };
  }
};
