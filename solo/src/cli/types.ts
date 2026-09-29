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
