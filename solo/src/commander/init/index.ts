import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import chalk from 'chalk';
import { checkSettings, checkClaude, checkTmux } from '../../core/checker';
import { SOLO_DIR } from '../../config';
import { readConfig, writeConfig, getConfigValue } from '../../core/ini';

// name 验证规则：英文字符开头，可包含数字、'-'、'_'
const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

function validateName(name: string): boolean {
  return NAME_REGEX.test(name);
}

/**
 * 生成 8~16 位的随机 name（英文字母开头，只包含字母和数字）
 */
function generateName(): string {
  const length = 8 + Math.floor(Math.random() * 9); // 8-16
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const firstChar = 'abcdefghijklmnopqrstuvwxyz';

  let name = firstChar[Math.floor(Math.random() * firstChar.length)];
  const bytes = randomBytes(length - 1);
  for (let i = 0; i < length - 1; i++) {
    name += chars[bytes[i] % chars.length];
  }
  return name;
}

export async function runInit(): Promise<void> {
  // 自动生成 name
  const name = generateName();

  console.log(chalk.blue.bold('正在检查环境...\n'));

  // 检查 .solo/config
  const { exists } = checkSettings();
  if (!exists) {
    console.log(chalk.cyan('创建 .solo/config...'));
    if (!existsSync(SOLO_DIR)) {
      mkdirSync(SOLO_DIR, { recursive: true });
    }
    writeConfig({ core: { name } });
    console.log(chalk.green(`✅ 已创建 .solo，name: ${name}`));
  } else {
    // 检查是否已存在合规的 name
    const existingName = getConfigValue('core', 'name');

    if (existingName && validateName(existingName)) {
      console.log(chalk.yellow(`⚠️ 已存在 name: ${existingName}`));
      console.log(chalk.gray('  如需修改，请手动编辑或删除 .solo/config 文件'));
      process.exit(1);
    }

    // 写入新的 name
    const config = readConfig();
    const updatedConfig = { ...config, core: { ...(config.core || {}), name } };
    writeConfig(updatedConfig);
    console.log(chalk.green(`✅ 已更新 .solo/config，name: ${name}`));
  }

  // 检查 claude CLI
  const claudeResult = await checkClaude();
  if (claudeResult.installed) {
    console.log(chalk.green(`✅ claude CLI 已安装: ${claudeResult.version}`));
  } else {
    console.log(chalk.red('❎ claude CLI 未安装'));
    console.log(chalk.gray('  请先安装: https://docs.anthropic.com/claude/docs/claude-cli'));
  }

  // 检查 tmux
  const tmuxResult = await checkTmux();
  if (tmuxResult.installed) {
    console.log(chalk.green(`✅ tmux 已安装: ${tmuxResult.version}`));
  } else {
    console.log(chalk.red('❌ tmux 未安装'));
    console.log(chalk.gray('  请先安装: brew install tmux (macOS) 或 apt install tmux (Linux)\n'));
  }
}
