import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { checkSettings, checkClaude, checkTmux } from '../../core/checker/index.js';

export async function runInit(): Promise<void> {
  console.log('正在检查环境...\n');

  // 检查 .solo/config
  const { exists, path: settingsPath } = checkSettings();
  if (!exists) {
    console.log('创建 .solo/config...');
    const claudeDir = dirname(settingsPath);
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    writeFileSync(settingsPath, JSON.stringify({}, null, 2));
    console.log('✅ 已创建 .solo/config');
  } else {
    console.log('✅ .solo/config 已存在');
  }

  // 检查 claude CLI
  const claudeResult = await checkClaude();
  if (claudeResult.installed) {
    console.log(`✅ claude CLI 已安装: ${claudeResult.version}`);
  } else {
    console.log('✗ claude CLI 未安装');
    console.log('  请先安装: https://docs.anthropic.com/claude/docs/claude-cli');
  }

  // 检查 tmux
  const tmuxResult = await checkTmux();
  if (tmuxResult.installed) {
    console.log(`✅ tmux 已安装: ${tmuxResult.version}`);
  } else {
    console.log('✗ tmux 未安装');
    console.log('  请先安装: brew install tmux (macOS) 或 apt install tmux (Linux)\n');
  }
}
