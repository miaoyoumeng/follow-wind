import { exec as nodeExec } from 'child_process';
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
