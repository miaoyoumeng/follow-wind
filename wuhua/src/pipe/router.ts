import { InstructQueue } from './queue';
import { selectPane, sendKeys, buildPaneKey } from '../tmux';
import { logger } from '../logging';
import type { Instruct } from './types';

/** 单条指令发送失败后的最大重试次数 */
const MAX_SEND_RETRY = 3;

/**
 * Tmux 指令路由器（负责向 pane 传递指令）
 */
export class TmuxRouter {
  session: string;
  window: string;
  paneIndex: number;
  queue: InstructQueue = new InstructQueue();

  /**
   * 构造路由器
   * @param session tmux session 名称
   * @param window tmux window 名称
   * @param paneIndex tmux pane index
   */
  constructor(session: string, window: string, paneIndex: number) {
    this.session = session;
    this.window = window;
    this.paneIndex = paneIndex;
  }

  /** 将指令加入队列 */
  enqueue(instruct: Instruct): void {
    this.queue.enqueue(instruct);
  }

  /** 从队列取一条指令执行 */
  async paneRolling(): Promise<void> {
    const tag = `[router:${buildPaneKey(this.session, this.window, this.paneIndex)}]`;
    logger.trace(`${tag} paneRolling invoked, queueSize=${this.queue.size()}`);
    const instruct = this.queue.dequeue();
    if (!instruct) {
      logger.debug(`${tag} queue empty, nothing to execute`);
      return;
    }

    try {
      logger.debug(`${tag} select pane, sending keys: ${instruct.prompt}`);
      await selectPane(this.session, this.window, this.paneIndex);
      await sendKeys(this.session, this.window, this.paneIndex, instruct.prompt);
      logger.debug(`${tag} instruct sent`);
    } catch (err) {
      const retryCount = (instruct.retryCount ?? 0) + 1;
      if (retryCount >= MAX_SEND_RETRY) {
        logger.error(`${tag} sendKeys failed ${retryCount} times, dropping instruct: ${String(err)}`);
        return;
      }
      logger.warn(`${tag} sendKeys failed (retry ${retryCount}/${MAX_SEND_RETRY}), requeue: ${String(err)}`);
      this.queue.enqueueFront({ ...instruct, retryCount });
    }
  }
}
