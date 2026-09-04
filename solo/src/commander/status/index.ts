import chalk from 'chalk';
import { checkSettings } from '../../core/checker';
import { getConfigValue } from '../../core/ini';

// name 验证规则：英文字符开头，可包含数字、'-'、'_'
const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/**
 * 验证工作区合规性，不合规则退出
 * @returns 合规的 name
 */
export function validateWorkspace(): string {
  // 检查 .solo/config 是否存在
  const { exists } = checkSettings();
  if (!exists) {
    console.log(chalk.red(`fatal: this dir is not solo workspace:\`.solo\`, please use \`solo init\``));
    process.exit(1);
  }

  // 检查 core.name 是否合规
  const name = getConfigValue('core', 'name');
  if (!name || !NAME_REGEX.test(name)) {
    console.log(chalk.red(`fatal: this dir is not solo workspace:\`.solo\`, please use \`solo init\``));
    process.exit(1);
  }

  return name;
}

export async function runStatus(): Promise<void> {
  const name = validateWorkspace();
  // 合规，显示状态信息
  console.log(chalk.green.bold('✅ solo workspace is ready'));
  console.log(chalk.gray(`  name: ${name}`));
}
