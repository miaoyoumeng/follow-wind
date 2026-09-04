import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { getConfigValue } from '../core/ini';

const execAsync = promisify(exec);

/**
 * 获取配置中的 session 名称
 */
export function getSessionName(): string {
  const name = getConfigValue('core', 'name');
  if (!name) {
    console.log(chalk.red('❌ 未找到 session name'));
    console.log(chalk.gray('  请先运行 `solo init` 初始化'));
    process.exit(1);
  }
  return name;
}

/**
 * 检查 session 是否存在
 */
export async function sessionExists(name: string): Promise<boolean> {
  try {
    await execAsync(`tmux has-session -t ${name} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

/**
 * 创建新的 session
 */
export async function createSession(name: string, dir?: string): Promise<void> {
  const cwd = dir || process.cwd();
  await execAsync(`tmux new-session -d -s ${name} -c ${cwd}`);
}

/**
 * 终止 session
 */
export async function killSession(name: string): Promise<void> {
  try {
    await execAsync(`tmux kill-session -t ${name}`);
  } catch {
    console.log(chalk.yellow(`⚠️ session ${name} 不存在或已终止`));
  }
}

/**
 * 附加到 session
 */
export async function attachSession(name: string): Promise<void> {
  await execAsync(`tmux attach-session -t ${name}`);
}

/**
 * 获取当前 session 信息
 */
export async function getCurrentSession(): Promise<{ id: string; name: string } | null> {
  try {
    const { stdout } = await execAsync('tmux display-message -p "#{session_id}\\t#{session_name}"');
    const [id, name] = stdout.trim().split('\t');
    return { id, name };
  } catch {
    return null;
  }
}
