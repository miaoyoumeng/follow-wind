import { InstructQueue } from './queue';
import { selectPane, sendKeysEnter } from '../tmux';
import { logger } from '../logging';
import type { Instruct } from './types';

/**
 * Tmux 指令路由器（负责向 pane 传递指令并等待输出稳定）
 */
export class TmuxRouter {
  session: string = '';
  window: string = '';
  paneIndex: number = 0;
  isStable: boolean = true;
  queue: InstructQueue = new InstructQueue();

  /** 将指令加入队列 */
  enqueue(instruct: Instruct): void {
    this.queue.enqueue(instruct);
  }

  /** 从队列取一条指令执行，等待外部调用 markStable() 通知完成 */
  async paneRolling(): Promise<void> {
    const tag = `[router:${this.session}:${this.window}.${this.paneIndex}]`;
    logger.trace(`${tag} paneRolling invoked, isStable=${this.isStable}, queueSize=${this.queue.size()}`);
    if (!this.isStable) {
      logger.info(`${tag} router is blocking, waiting for markStable`);
      return;
    }
    const instruct = this.queue.dequeue();
    if (!instruct) {
      logger.debug(`${tag} queue empty, nothing to execute`);
      return;
    }
    this.isStable = false;
    const executed = await this.executeInstruct(instruct);
    if (!executed) {
      this.isStable = true;
      return;
    }
    logger.debug(`${tag} instruct sent, waiting for Stop event`);
  }
  /** 标记 pane 已稳定（由 Stop hook 通过 IPC 触发） */
  markStable(): void {
    this.isStable = true;
  }

  /** 执行 selectPane + sendKeysEnter；成功返回 true，异常返回 false */
  private async executeInstruct(instruct: Instruct): Promise<boolean> {
    const tag = `[router:${this.session}:${this.window}.${this.paneIndex}]`;
    try {
      logger.debug(`${tag} select pane, sending keys: ${instruct.command}`);
      await selectPane(this.session, this.window, this.paneIndex);
      await sendKeysEnter(this.session, this.window, this.paneIndex, instruct.command);
      return true;
    } catch (err) {
      logger.warn(`${tag} sendKeysEnter error: ${String(err)}`);
      return false;
    }
  }
}
