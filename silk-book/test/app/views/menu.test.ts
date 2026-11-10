import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

describe('Menu View', () => {
  const menuPath = join(rootDir, 'src/app/views/menu.ts');
  const menuContent = readFileSync(menuPath, 'utf-8');

  it('应该导入 electron 模块', () => {
    expect(menuContent).toContain("import { app, dialog, Menu } from 'electron'");
  });

  it('应该导入 platform 工具', () => {
    expect(menuContent).toContain("import { platform } from '../utils/platform");
  });

  it('应该导出 registerMacAppMenu 函数', () => {
    expect(menuContent).toContain('export const registerMacAppMenu');
  });

  it('应该在非 macOS 平台设置菜单为 null', () => {
    expect(menuContent).toContain('Menu.setApplicationMenu(null)');
  });

  it('应该创建应用子菜单', () => {
    expect(menuContent).toContain("label: 'Chat2DB'");
    expect(menuContent).toContain('submenu');
  });

  it('应该包含关于、重启、退出选项', () => {
    expect(menuContent).toContain('关于');
    expect(menuContent).toContain('重新启动');
    expect(menuContent).toContain('退出');
  });

  it('应该创建编辑子菜单', () => {
    expect(menuContent).toContain("label: '编辑'");
    expect(menuContent).toContain('undo');
    expect(menuContent).toContain('redo');
  });

  it('应该使用 Menu.buildFromTemplate 创建菜单', () => {
    expect(menuContent).toContain('Menu.buildFromTemplate');
  });
});
