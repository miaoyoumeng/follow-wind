import { Command } from 'commander';
import { VersionCommand } from './commander/version.js';
import { HelpCommand } from './commander/help.js';

const program: Command = new Command();

// 禁用内置的 help 选项 或者 -h --help
program.helpOption(false);

program.name('silkbook').description('Silk-Book CLI 工具');

// 子命令：version
program
  .command('version')
  .description('查看版本号')
  .action(() => {
    VersionCommand.of().execute();
  });

// 子命令：help
program
  .command('help')
  .description('显示帮助信息')
  .action(() => {
    HelpCommand.of().execute();
  });

// 自定义参数
program
  .option('-v, --version', '查看版本号')
  .option('-h, --help', '显示帮助信息')
  .action(options => {
    if (options.version) {
      VersionCommand.of().execute();
    } else if (options.help) {
      HelpCommand.of().execute();
    }
  });

program.parse();
