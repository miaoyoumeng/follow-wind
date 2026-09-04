import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkClaude(): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync('claude --version');
    return { installed: true, version: stdout.trim() };
  } catch {
    return { installed: false };
  }
}
