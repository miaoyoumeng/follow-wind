import { writeFile, readFile } from '../utils';
import { PID_PATH } from '../config/paths';
import { debug } from '../logging';

/**
 * 将当前进程 PID 写入 .solo/pid 文件
 * 用于后续 IPC 通信时定位 solo start 进程
 */
export const writePidFile = (): void => {
  writeFile(PID_PATH, String(process.pid));
  debug(`[pid] wrote PID ${process.pid} to ${PID_PATH}`);
};

/**
 * 读取 .solo/pid 中的 PID
 * @returns PID 数字；文件不存在或内容非法时返回 null
 */
export const readPidFile = (): number | null => {
  const content = readFile(PID_PATH);
  if (content === null) return null;
  const pid = parseInt(content.trim(), 10);
  return isNaN(pid) ? null : pid;
};

/**
 * 检查指定 PID 的进程是否存活
 * 使用 signal 0 探测进程存在性，不实际发送信号
 * @param pid 进程 ID
 * @returns true 表示进程存活，false 表示进程不存在或无权限
 */
export const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
