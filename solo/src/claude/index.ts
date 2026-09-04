import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function startClaude(sessionName: string): Promise<void> {
  await execAsync(`tmux send-keys -t ${sessionName} 'claude' C-m`);
}
