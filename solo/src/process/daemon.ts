import { logger } from '../logging';
import { listTasks } from '../task';
import { statTask } from '../commander/status';
import { startIpcServer, stopIpcServer } from '../ipc/ipcServer';
import { readConfig, getIpcSocketPath } from '../config';

/** 心跳间隔（毫秒） */
const HEARTBEAT_INTERVAL = 30_000;

let heartbeatId: ReturnType<typeof setInterval> | null = null;
let ipcRunning = false;

/**
 * 启动常住进程，维护 taskStorage 单例
 * 启动 IPC 服务端接收外部进程请求；启动心跳定期输出 taskStorage 统计信息
 * IPC socket 路径从配置 name 计算：.solo/ipc-[name].sock
 * @param onListening IPC socket 开始监听后的回调
 * @returns stop 函数，调用后停止心跳并关闭 IPC 服务端
 */
export const startDaemon = (onListening?: () => void): (() => void) => {
  // 防止重复启动
  if (heartbeatId !== null) {
    return stopDaemon;
  }

  const { name } = readConfig();
  const socketPath = getIpcSocketPath(name);

  const initialStat = statTask(listTasks());
  logger.debug(
    `[daemon] started, taskStorage stat: pending=${initialStat.pending} running=${initialStat.running} completed=${initialStat.completed} timeout=${initialStat.timeout} failed=${initialStat.failed} killed=${initialStat.killed}`
  );

  // 启动 IPC 服务端，exit 方法触发时调用 stopDaemon 优雅关闭
  startIpcServer(
    socketPath,
    () => {
      stopDaemon();
    },
    () => {
      ipcRunning = true;
      heartbeatId = setInterval(() => {
        const stat = statTask(listTasks());
        logger.debug(
          `[daemon] heartbeat, taskStorage stat: pending=${stat.pending} running=${stat.running} completed=${stat.completed} timeout=${stat.timeout} failed=${stat.failed} killed=${stat.killed}`
        );
      }, HEARTBEAT_INTERVAL);
      onListening?.();
    }
  );

  return stopDaemon;
};

/**
 * 停止常住进程心跳并关闭 IPC 服务端
 */
export const stopDaemon = (): void => {
  if (heartbeatId !== null) {
    clearInterval(heartbeatId);
    heartbeatId = null;
    logger.info('[daemon] heartbeat stopped');
  }
  if (ipcRunning) {
    stopIpcServer();
    ipcRunning = false;
  }
};
