import { debug } from '../logging';
import { statTask } from '../task';
import { startIpcServer, stopIpcServer } from '../ipc/ipcServer';

/** 心跳间隔（毫秒） */
const HEARTBEAT_INTERVAL = 30_000;

let heartbeatId: ReturnType<typeof setInterval> | null = null;
let ipcRunning = false;

/**
 * 启动常住进程，维护 taskStorage 单例
 * 启动 IPC 服务端接收外部进程请求；启动心跳定期输出 taskStorage 统计信息
 * @param onListening IPC socket 开始监听后的回调
 * @returns stop 函数，调用后停止心跳并关闭 IPC 服务端
 */
export const startDaemon = (onListening?: () => void): (() => void) => {
  // 防止重复启动
  if (heartbeatId !== null) {
    return stopDaemon;
  }

  const initialStat = statTask();
  debug(
    `[daemon] started, taskStorage stat: pending=${initialStat.pending} running=${initialStat.running} completed=${initialStat.completed} timeout=${initialStat.timeout} failed=${initialStat.failed} killed=${initialStat.killed}`
  );

  // 启动 IPC 服务端，exit 方法触发时调用 stopDaemon 优雅关闭
  startIpcServer(
    () => {
      stopDaemon();
    },
    () => {
      ipcRunning = true;
      heartbeatId = setInterval(() => {
        const stat = statTask();
        debug(
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
    debug('[daemon] heartbeat stopped');
  }
  if (ipcRunning) {
    stopIpcServer();
    ipcRunning = false;
  }
};
