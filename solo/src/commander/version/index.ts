import { join } from 'path';
import { readFileSync } from 'fs';
import { checkSettings, checkClaude, checkTmux } from '../../core/checker/index.js';

export async function runVersion(): Promise<void> {
  const errors: string[] = [];

  // 检查 .solo/config
  const { exists } = checkSettings();
  if (!exists) {
    errors.push('未找到 .solo/config，请先运行 `solo init`');
  }

  // 检查 claude CLI
  const claudeResult = await checkClaude();
  if (!claudeResult.installed) {
    errors.push('claude CLI 未安装，请先安装: https://docs.anthropic.com/claude/docs/claude-cli');
  }

  // 检查 tmux
  const tmuxResult = await checkTmux();
  if (!tmuxResult.installed) {
    errors.push('tmux 未安装，请先安装: brew install tmux (macOS) 或 apt install tmux (Linux)');
  }

  // 如果有错误，输出并终止
  if (errors.length > 0) {
    errors.forEach(err => console.log(`✗ ${err}`));
    process.exit(1);
  }

  // 显示 solo 版本（从模块位置向上查找 package.json）
  const pkgPath = join(__dirname, '../../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  console.log(`solo v${pkg.version}`);
}
