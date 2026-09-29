import { exec as nodeExec, spawn, type ChildProcess, type SpawnOptions } from 'child_process';
import { promisify } from 'util';

import type { ExecFn } from './types';

/**
 * 将 child_process.exec 封装为 Promise 版本
 * @param cmd 要执行的 shell 命令
 * @returns Promise，resolve 为 { stdout, stderr }
 */
export const execAsync = promisify(nodeExec);

/**
 * exec 可替换容器：函数通过 exec.fn() 调用，测试可通过 mock 整个模块替换
 * @property fn 当前执行函数，默认为 execAsync，可替换为自定义实现
 */
export const exec: { fn: ExecFn } = {
  fn: execAsync
};

/**
 * 通用 spawn 入口：透传 child_process.spawn
 * @param command 可执行文件路径
 * @param args 参数列表
 * @param options spawn 选项
 * @returns 子进程实例
 */
export const spawnChild = (command: string, args: string[], options?: SpawnOptions): ChildProcess => {
  return options !== undefined ? spawn(command, args, options) : spawn(command, args);
};

/**
 * 启动子进程并继承终端 stdio，子进程退出时同步退出当前进程
 * @param command 要执行的命令
 * @param args 命令参数列表
 * @returns 子进程实例
 */
export const terminal = (command: string, args: string[]): ChildProcess => {
  const child = spawnChild(command, args, { stdio: 'inherit' });
  child.on('exit', (code: number | null) => {
    process.exit(code ?? 0);
  });
  return child;
};
