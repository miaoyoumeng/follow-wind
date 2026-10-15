import chalk from 'chalk';

import { readPidFile, isProcessAlive } from '../bootstrap';

/**
 * 检查 daemon 进程是否存活
 * @returns true 表示 daemon 存活，false 表示未启动并已打印提示
 */
export const checkDaemonAlive = (): boolean => {
  const pid = readPidFile();
  const isAlive = pid !== null && isProcessAlive(pid);
  if (!isAlive) {
    console.log(chalk.yellow('📋 wuhua 未启动'));
    console.log(chalk.gray('   请先运行 `wuhua start` 启动服务'));
  }
  return isAlive;
};
