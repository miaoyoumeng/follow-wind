import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('CLI Index', () => {
  const cliPath = join(__dirname, '../../src/cli/index.ts');
  const cliContent = readFileSync(cliPath, 'utf-8');

  it('应该导入 Command 模块', () => {
    expect(cliContent).toContain("import { Command } from 'commander'");
  });

  it('应该导入 VersionCommand', () => {
    expect(cliContent).toContain("import { VersionCommand } from './commander/version.js'");
  });

  it('应该导入 HelpCommand', () => {
    expect(cliContent).toContain("import { HelpCommand } from './commander/help.js'");
  });

  it('应该创建 Command 实例', () => {
    expect(cliContent).toContain('new Command()');
  });

  it('应该禁用内置的 help 选项', () => {
    expect(cliContent).toContain('helpOption(false)');
  });

  it('应该设置正确的 CLI 名称和描述', () => {
    expect(cliContent).toContain(".name('silkbook')");
    expect(cliContent).toContain(".description('Silk-Book CLI 工具')");
  });

  it('应该注册 version 子命令', () => {
    expect(cliContent).toContain(".command('version')");
    expect(cliContent).toContain(".description('查看版本号')");
    expect(cliContent).toContain('VersionCommand.of().execute()');
  });

  it('应该注册 help 子命令', () => {
    expect(cliContent).toContain(".command('help')");
    expect(cliContent).toContain(".description('显示帮助信息')");
    expect(cliContent).toContain('HelpCommand.of().execute()');
  });

  it('应该注册 -v/--version 选项', () => {
    expect(cliContent).toContain("'-v, --version'");
    expect(cliContent).toContain('查看版本号');
  });

  it('应该注册 -h/--help 选项', () => {
    expect(cliContent).toContain("'-h, --help'");
    expect(cliContent).toContain('显示帮助信息');
  });

  it('应该调用 parse 方法', () => {
    expect(cliContent).toContain('program.parse()');
  });
});
