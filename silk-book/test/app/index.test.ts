import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

describe('App Index', () => {
  const indexPath = join(rootDir, 'src/app/index.ts');
  const indexContent = readFileSync(indexPath, 'utf-8');

  it('应该导入 electron 模块', () => {
    expect(indexContent).toContain("import { app, BrowserWindow, ipcMain, dialog } from 'electron'");
  });

  it('应该导入 createMainWindow 函数', () => {
    expect(indexContent).toContain("import { createMainWindow } from './views/window");
  });

  it('应该导入 registerMacAppMenu 函数', () => {
    expect(indexContent).toContain("import { registerMacAppMenu } from './views/menu");
  });

  it('应该使用 app.whenReady 注册初始化逻辑', () => {
    expect(indexContent).toContain('app.whenReady()');
  });

  it('应该注册 dialog:openFile 处理器', () => {
    expect(indexContent).toContain("ipcMain.handle('dialog:openFile'");
    expect(indexContent).toContain('handleFileOpen');
  });

  it('应该创建主窗口', () => {
    expect(indexContent).toContain('createMainWindow()');
  });

  it('应该注册 Mac 应用菜单', () => {
    expect(indexContent).toContain('registerMacAppMenu()');
  });

  it('应该处理 window-all-closed 事件', () => {
    expect(indexContent).toContain("app.on('window-all-closed'");
  });

  it('应该导出 handleFileOpen 函数', () => {
    expect(indexContent).toContain('async function handleFileOpen');
    expect(indexContent).toContain('dialog.showOpenDialog');
  });
});
