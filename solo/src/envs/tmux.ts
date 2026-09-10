import { execAsync } from '../process';
import { BaseEnvHandler } from './base';
import type { EnvCheckResult } from './types';

/**
 * Tmux 环境检测 Handler
 */
export class TmuxHandler extends BaseEnvHandler {
  async handle(): Promise<EnvCheckResult> {
    try {
      const { stdout } = await execAsync('tmux -V');
      return {
        tmux: {
          installed: true,
          version: stdout.trim()
        }
      };
    } catch {
      return {
        tmux: {
          installed: false
        }
      };
    }
  }
}
