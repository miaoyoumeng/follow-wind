import { randomBytes } from 'crypto';
import chalk from 'chalk';

import { SOLO_DIR, CONFIG_PATH_NAME, SOLO_DIR_NAME, readConfig, writeConfig, type SoloConfig } from '../config';
import { checkSettings, checkClaude, checkTmux } from '../envs';
import { exists, ensureDir } from '../utils';

// name 验证规则：英文字符开头，可包含数字、'-'、'_'
const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

const validateName = (name: string): boolean => {
  return NAME_REGEX.test(name);
};

/**
 * 生成 8~16 位的随机 name（英文字母开头，只包含字母和数字）
 */
const generateName = (): string => {
  const length = 8 + Math.floor(Math.random() * 9); // 8-16
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const firstChar = 'abcdefghijklmnopqrstuvwxyz';

  let name = firstChar[Math.floor(Math.random() * firstChar.length)];
  const bytes = randomBytes(length - 1);
  for (let i = 0; i < length - 1; i++) {
    name += chars[bytes[i] % chars.length];
  }
  return name;
};

const checkToolInstalled = async (
  checkFn: () => Promise<{ installed: boolean; version?: string }>,
  name: string,
  installHint: string
): Promise<void> => {
  const result = await checkFn();
  if (result.installed) {
    console.log(chalk.green(`✅ ${name} 已安装: ${result.version}`));
  } else {
    console.log(chalk.red(`❌ ${name} 未安装`));
    console.log(chalk.gray(`  请先安装: ${installHint}`));
  }
};

const initSettings = (name: string): void => {
  const { exists: configExists } = checkSettings();
  if (!configExists) {
    console.log(chalk.cyan(`创建 ${CONFIG_PATH_NAME}...`));
    if (!exists(SOLO_DIR)) ensureDir(SOLO_DIR);
    writeConfig({ name });
    console.log(chalk.green(`✅ 已创建目录\`${SOLO_DIR_NAME}\`，name: ${name}`));
    return;
  }
  let config: SoloConfig = { name: '' };
  try {
    config = readConfig();
  } catch {
    console.log(chalk.yellow(`⚠️ ${CONFIG_PATH_NAME} 解析失败，将重新初始化`));
  }
  if (config.name && validateName(config.name)) {
    console.log(chalk.yellow(`⚠️ 已存在 name: ${config.name}`));
    console.log(chalk.gray(`如需修改，请手动编辑或删除 ${CONFIG_PATH_NAME} 文件`));
    process.exit(1);
  }
  writeConfig({ ...config, name });
  console.log(chalk.green(`✅ 已更新 ${CONFIG_PATH_NAME}，name: ${name}`));
};

export const runInit = async (): Promise<void> => {
  const name = generateName();
  console.log(chalk.blue.bold('正在检查环境...\n'));
  initSettings(name);
  await checkToolInstalled(checkClaude, 'claude CLI', 'https://docs.anthropic.com/claude/docs/claude-cli');
  await checkToolInstalled(checkTmux, 'tmux', 'brew install tmux (macOS) 或 apt install tmux (Linux)');
};
