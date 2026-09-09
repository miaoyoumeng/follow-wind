import { execAsync } from '../process';
import type { CheckResult } from './types';

export const checkClaude = async (): Promise<CheckResult> => {
  try {
    const { stdout } = await execAsync('claude --version');
    return { installed: true, version: stdout.trim() };
  } catch {
    return { installed: false };
  }
};
