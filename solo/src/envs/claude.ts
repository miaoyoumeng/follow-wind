import { execAsync } from '../process';
import { BaseEnvHandler } from './base';
import type { EnvCheckResult } from './types';

/**
 * Claude 环境检测 Handler
 */
export class ClaudeHandler extends BaseEnvHandler {
  async handle(): Promise<EnvCheckResult> {
    try {
      const { stdout } = await execAsync('claude --version');
      return {
        claude: {
          installed: true,
          version: stdout.trim()
        }
      };
    } catch {
      return {
        claude: {
          installed: false
        }
      };
    }
  }
}
