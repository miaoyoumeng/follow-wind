import type { EnvHandler, EnvCheckResult } from './types';

/**
 * 责任链基类：提供链式连接能力
 */
export abstract class BaseEnvHandler implements EnvHandler {
  private nextHandler: EnvHandler | null = null;

  setNext(handler: EnvHandler): EnvHandler {
    this.nextHandler = handler;
    return handler;
  }

  getNext(): EnvHandler | null {
    return this.nextHandler;
  }

  abstract handle(): Promise<EnvCheckResult> | EnvCheckResult;
}
