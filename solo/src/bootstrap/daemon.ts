import { logger } from '../logging';
import { startIpcServer, stopIpcServer } from '../ipc/server';
import { readConfig, getIpcSocketPath } from '../config';
import { readPidFile, isProcessAlive } from './pid';
import { startHeartbeat, stopHeartbeat } from './heartbeat';
import { clearAll } from '../pipe/dispatcher';

let ipcRunning = false;

/**
 * 检查 solo daemon 进程是否已运行
 * @returns true 表示 daemon 已运行（应跳过启动），false 表示未运行
 */
export const isDaemonRunning = (): boolean => {
  const pid = readPidFile();
  return pid !== null && isProcessAlive(pid);
};

/**
 * 启动常住进程，维护 chatTaskStorage 单例
 * 启动 IPC 服务端接收外部进程请求；启动心跳定期输出 chatTaskStorage 统计信息
 * IPC socket 路径从配置 name 计算：.solo/ipc-[name].sock
 * @param onListening IPC socket 开始监听后的回调
 * @returns stop 函数，调用后停止心跳并关闭 IPC 服务端
 */
export const startDaemon = (onListening?: () => void): (() => void) => {
  if (ipcRunning) {
    return stopDaemon;
  }

  const { name } = readConfig();
  const socketPath = getIpcSocketPath(name);

  // 启动 IPC 服务端，exit 方法触发时调用 stopDaemon 优雅关闭
  startIpcServer(
    socketPath,
    () => {
      stopDaemon();
    },
    () => {
      ipcRunning = true;
      startHeartbeat();
      logger.info(`ipc running ${name}`);
      onListening?.();
    }
  );

  return stopDaemon;
};

/**
 * 停止常住进程心跳并关闭 IPC 服务端，清理 dispatcher 内存
 */
export const stopDaemon = (): void => {
  stopHeartbeat();
  clearAll();
  if (ipcRunning) {
    stopIpcServer();
    ipcRunning = false;
  }
};
