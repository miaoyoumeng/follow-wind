import type { Task } from './types';
import { logger } from '../logging';

const POLL_INTERVAL_MS = 30_000;
const DEFAULT_WAIT_MINUTES = 60;

/**
 * setInterval 轮询：每 30s 调用 roller 执行任务，超时后调用 timeoutRunner
 * @param task 任务对象
 * @param roller 每次轮询调用的函数
 * @param timeoutRunner 超时后调用的函数
 */
export const pollingWithTimeout = (
  task: Task,
  roller: (task: Task) => boolean | Promise<boolean>,
  timeoutRunner: (task: Task) => void
): void => {
  const maxMs = DEFAULT_WAIT_MINUTES * 60_000;
  const startTime = Date.now();

  const intervalId = setInterval(() => {
    if (Date.now() - startTime >= maxMs) {
      clearInterval(intervalId);
      logger.debug(`[task:${task.id}] polling timeout, invoking timeoutRunner`);
      timeoutRunner(task);
      return;
    }
    void Promise.resolve(roller(task)).then(done => {
      if (done) {
        clearInterval(intervalId);
      }
    });
  }, POLL_INTERVAL_MS);
};
