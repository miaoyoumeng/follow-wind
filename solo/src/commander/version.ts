import chalk from 'chalk';
import { checkSettings, checkClaude, checkTmux } from '../envs';
import { getVersion } from '../utils';

export const runVersion = async (): Promise<void> => {
  const errors: string[] = [];

  // 检查 .solo/config
  const { exists } = checkSettings();
  if (!exists) {
    errors.push('❌ 未找到 .solo/config，请先运行 `solo init`');
  }

  // 检查 claude CLI
  const claudeResult = await checkClaude();
  if (!claudeResult.installed) {
    errors.push('claude CLI 未安装，请先安装: https://docs.anthropic.com/claude/docs/claude-cli');
  }

  // 检查 tmux
  const tmuxResult = await checkTmux();
  if (!tmuxResult.installed) {
    errors.push('❌ tmux 未安装，请先安装: brew install tmux (macOS) 或 apt install tmux (Linux)');
  }

  // 如果有错误，输出并终止
  if (errors.length > 0) {
    errors.forEach(err => console.log(chalk.red(`❌ ${err}`)));
    process.exit(1);
  }

  // 显示 solo 版本
  console.log(chalk.yellow.bold(`solo version ${getVersion()}`));
};
