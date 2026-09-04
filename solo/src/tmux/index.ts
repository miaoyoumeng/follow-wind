import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export * from './session';

export interface TmuxSession {
  name: string;
  dir: string;
}

export async function listSessions(): Promise<TmuxSession[]> {
  try {
    const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}:#{session_path}"');
    return stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [name, dir] = line.split(':');
        return { name, dir };
      });
  } catch {
    return [];
  }
}
