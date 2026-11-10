import chalk from 'chalk';

/**
 * 帮助命令处理器 - 单例模式
 */
export class HelpCommand {
  private static instance: HelpCommand;

  /**
   * 私有构造函数，防止外部实例化
   */
  private constructor() {}

  /**
   * 获取单例实例
   * @returns HelpCommand 单例实例
   */
  public static of(): HelpCommand {
    if (!HelpCommand.instance) {
      HelpCommand.instance = new HelpCommand();
    }
    return HelpCommand.instance;
  }

  /**
   * 执行命令，显示帮助信息
   */
  public execute(): void {
    console.log(chalk.black('用法:'));
    console.log(chalk.gray('  silkbook [命令]\n'));
    console.log(chalk.black('可用命令:'));
    console.log(chalk.gray('  version    查看版本号'));
    console.log(chalk.gray('  help       显示帮助信息'));
    console.log(chalk.black('\n可用参数:'));
    console.log(chalk.gray('  -v, --version  输出版本号'));
    console.log(chalk.gray('  -h, --help     输出帮助信息\n'));
  }
}
