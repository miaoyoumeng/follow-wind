/** 命令位置参数定义 */
export interface CommandArg {
  /** commander 参数语法，如 '<agent>'（必填）或 '[date]'（可选） */
  readonly syntax: string;
  /** 参数说明，出现在 --help 中 */
  readonly description: string;
  /** 参数解析器，如 parseInt */
  readonly parser?: (value: string) => unknown;
}

/** 命令选项定义 */
export interface CommandOption {
  /** commander 选项 flag，如 '--name <name>' */
  readonly flags: string;
  /** 选项说明，出现在 --help 中 */
  readonly description: string;
  /** 是否为必填选项（对应 commander 的 requiredOption） */
  readonly isRequired?: boolean;
  /** 选项值解析器，如 parseInt（对应 commander 的第三个选项参数） */
  readonly parser?: (value: string) => unknown;
}

/** 子命令定义（命令模式中被封装的「请求对象」） */
export interface CommandSpec {
  readonly name: string;
  readonly description: string;
  readonly args?: readonly CommandArg[];
  readonly options?: readonly CommandOption[];
  /**
   * 是否允许多余的位置参数（对应 commander 的 allowExcessArguments）。
   * 默认允许；显式设为 false 时，传入多余参数会报错
   */
  readonly allowExcessArguments?: boolean;
  /**
   * 命令实现。调用时收到的实参为 `(声明的 args..., options 对象, command 对象)`
   * （commander 的 action 约定，见 lib/command.js:534-540）——
   * 未声明 args 的命令，首个实参即 options 对象。
   * 实现按固定元数接收即可，多余实参会被 JavaScript 忽略。
   *
   * 声明为 `(...args: never[])` 以兼容各命令各异的参数签名：never 是所有类型的子类型，
   * 因此 `() => void`、`(name: string, date?: string) => Promise<void>` 等任意签名均可赋值。
   * 调用点按 commander 实际传入的参数收窄类型。
   */
  readonly execute: (...args: never[]) => Promise<void> | void;
}

/** wuhua prompt 执行单条 prompt 的定位与超时上下文 */
export interface PromptTarget {
  /** tmux session 名称 */
  readonly sessionName: string;
  /** agent 名称，同时是 tmux window 名 */
  readonly agentName: string;
  /** claude pane 索引 */
  readonly paneIndex: number;
  /** 等待 Claude Stop 的超时毫秒数 */
  readonly timeoutMs: number;
}

/** 单个 agent 的 tmux 命令提交结果 */
export interface AgentDispatchResult {
  /** agent 名称，同时是 tmux window 名 */
  readonly name: string;
  /** 目标 pane 索引 */
  readonly paneIndex: number;
  /** 命令是否已成功提交到 pane */
  readonly isSuccess: boolean;
  /** 提交失败的原因，成功时为 undefined */
  readonly error?: string;
}
