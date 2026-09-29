/** 环境检测结果 - 统一类型 */
export interface EnvCheckResult {
  settings?: { exists: boolean; path: string };
  git?: { installed: boolean; version?: string };
  claude?: { installed: boolean; version?: string };
  tmux?: { installed: boolean; version?: string };
}

/** 环境检测 Handler 接口 */
export interface EnvHandler {
  /** 执行检测并返回结果 */
  handle(): Promise<EnvCheckResult> | EnvCheckResult;
  /** 设置下一个 handler，返回下一个 handler 以支持链式调用 */
  setNext(handler: EnvHandler): EnvHandler;
  /** 获取下一个 handler */
  getNext(): EnvHandler | null;
}
