import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import path from 'path';

import { fileURLToPath } from 'url';

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ESM 中获取当前文件目录的等效方式

export class VersionCommand {
  /**
   * 私有构造函数，防止外部实例化
   */
  private static instance: VersionCommand;
  /**
   * 获取 package.json 中的版本号
   * @returns 版本号字符串
   */
  private version: string;

  /**
   * 构造函数
   * @private
   */
  private constructor() {
    // ESM 中获取当前文件目录的等效方式
    // 从 dist/cli/commander/version.js 到 根目录/package.json
    const packagePath = join(__dirname, '../../../package.json');
    const json: string = readFileSync(packagePath, 'utf-8');
    const pkg: { version: string } = JSON.parse(json);
    this.version = pkg.version || '1.0.0';
  }

  /**
   * 获取单例实例
   * @returns VersionCommand 单例实例
   */
  public static of(): VersionCommand {
    if (!VersionCommand.instance) {
      VersionCommand.instance = new VersionCommand();
    }
    return VersionCommand.instance;
  }

  /**
   * 执行命令，显示版本号信息
   */
  public execute = (): void => {
    console.log(chalk.green(`silkbook 版本号：${this.version}`));
  };
}
