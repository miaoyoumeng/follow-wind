import chalk from 'chalk';

import { checkSettings, checkGit, checkTmux, checkClaude } from '../envs';
import { readConfig, NAME_REGEX } from '../config';

/**
 * 检查工具是否安装并输出结果
 * @param name 工具名称
 * @param result 检测结果
 * @returns 是否通过
 */
const checkTool = (name: string, result: { installed: boolean; version?: string }): boolean => {
  if (result.installed) {
    console.log(chalk.green(`✅ ${name}: ${result.version}`));
    return true;
  }
  console.log(chalk.red(`❌ ${name}: 未安装`));
  return false;
};

/**
 * 诊断环境和配置是否合规
 */
export const runDoctor = async (): Promise<void> => {
  let allPassed = true;

  console.log(chalk.blue.bold('诊断环境...\n'));

  // 1. 检查 config.yaml 是否存在
  const { exists } = checkSettings();
  if (!exists) {
    console.log(chalk.red('❌ config.yaml: 不存在，请先运行 `solo init`'));
    allPassed = false;
  } else {
    // 2. 检查 config.yaml 是否可解析
    try {
      const config = readConfig();
      if (!config.name || !NAME_REGEX.test(config.name)) {
        console.log(chalk.red('❌ config.yaml: name 字段缺失或非法'));
        allPassed = false;
      } else {
        console.log(chalk.green(`✅ config.yaml: name=${config.name}`));
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`❌ config.yaml: 解析失败 - ${reason}`));
      allPassed = false;
    }
  }

  // 3. 检查环境工具
  const gitResult = await checkGit();
  if (!checkTool('git', gitResult)) {
    allPassed = false;
  }

  const tmuxResult = await checkTmux();
  if (!checkTool('tmux', tmuxResult)) {
    allPassed = false;
  }

  const claudeResult = await checkClaude();
  if (!checkTool('claude', claudeResult)) {
    allPassed = false;
  }

  if (!allPassed) {
    process.exit(1);
  }
};
