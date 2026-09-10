import { spawn, type ChildProcess } from 'child_process';

/**
 * 启动子进程并继承终端 stdio，子进程退出时同步退出当前进程
 * @param command 要执行的命令
 * @param args 命令参数列表
 * @returns 子进程实例
 */
export const terminal = (command: string, args: string[]): ChildProcess => {
  const child = spawn(command, args, { stdio: 'inherit' });
  child.on('exit', (code: number | null) => {
    process.exit(code ?? 0);
  });
  return child;
};
