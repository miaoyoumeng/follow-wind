import { execAsync } from '../process';
import type { ExecFn } from './types';

/**
 * exec 可替换容器：函数通过 exec.fn() 调用，测试可通过 mock 整个模块替换
 */
export const exec: { fn: ExecFn } = {
  fn: execAsync
};
