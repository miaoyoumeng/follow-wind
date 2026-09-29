import { execAsync } from '../process';
import { BaseEnvHandler } from './base';
import type { EnvCheckResult } from './types';

/**
 * Git 环境检测 Handler
 */
export class GitHandler extends BaseEnvHandler {
  async handle(): Promise<EnvCheckResult> {
    try {
      const { stdout } = await execAsync('git --version');
      return {
        git: {
          installed: true,
          version: stdout.trim()
        }
      };
    } catch {
      return {
        git: {
          installed: false
        }
      };
    }
  }
}
