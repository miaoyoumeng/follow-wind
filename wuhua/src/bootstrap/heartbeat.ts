import { logger } from '../logging';

const HEARTBEAT_INTERVAL_MS = 60_000;

let heartbeatId: ReturnType<typeof setInterval> | null = null;

/**
 * 启动心跳检测轮询，每 1 分钟输出一次 debug 日志
 */
export const startHeartbeat = (): void => {
  if (heartbeatId !== null) {
    return;
  }

  heartbeatId = setInterval(() => {
    logger.trace('[heartbeat] solo server alive');
  }, HEARTBEAT_INTERVAL_MS);
};

/**
 * 停止心跳检测轮询
 */
export const stopHeartbeat = (): void => {
  if (heartbeatId === null) {
    return;
  }
  clearInterval(heartbeatId);
  heartbeatId = null;
};
