import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TmuxSession {
  name: string;
  dir: string;
}

export async function createSession(name: string, dir: string): Promise<void> {
  await execAsync(`tmux new-session -d -s ${name} -c ${dir}`);
}

export async function listSessions(): Promise<TmuxSession[]> {
  try {
    const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}:#{session_path}"');
    return stdout.trim().split('\n').filter(Boolean).map(line => {
      const [name, dir] = line.split(':');
      return { name, dir };
    });
  } catch {
    return [];
  }
}

export async function killSession(name: string): Promise<void> {
  await execAsync(`tmux kill-session -t ${name}`);
}
