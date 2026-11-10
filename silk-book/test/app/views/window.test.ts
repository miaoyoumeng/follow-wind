import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

describe('Window View', () => {
  const windowPath = join(rootDir, 'src/app/views/window.ts');
  const windowContent = readFileSync(windowPath, 'utf-8');

  it('应该导入 electron 模块', () => {
    expect(windowContent).toContain("import { BrowserWindow, globalShortcut, shell } from 'electron'");
  });

  it('应该导入 path 模块', () => {
    expect(windowContent).toContain("import path from 'path'");
  });

  it('应该导入 env 工具', () => {
    expect(windowContent).toContain("import { env } from '../utils/env");
  });

  it('应该导入 store', () => {
    expect(windowContent).toContain("import { store } from '../store");
  });

  it('应该导出 createMainWindow 函数', () => {
    expect(windowContent).toContain('export function createMainWindow');
  });

  it('应该创建 BrowserWindow 实例', () => {
    expect(windowContent).toContain('new BrowserWindow');
  });

  it('应该设置窗口配置', () => {
    expect(windowContent).toContain('minWidth');
    expect(windowContent).toContain('minHeight');
    expect(windowContent).toContain('frame: false');
    expect(windowContent).toContain('useContentSize: true');
  });

  it('应该调用 show 方法显示窗口', () => {
    expect(windowContent).toContain('mainWindow.show()');
  });

  it('应该加载主进程资源', () => {
    expect(windowContent).toContain('loadMainResource');
  });

  it('应该注册快捷键打开开发者工具', () => {
    expect(windowContent).toContain("globalShortcut.register('CommandOrControl+Shift+I'");
    expect(windowContent).toContain('openDevTools');
  });

  it('应该监听窗口事件', () => {
    expect(windowContent).toContain(".on('resize'");
    expect(windowContent).toContain(".on('move'");
    expect(windowContent).toContain(".on('minimize'");
  });
});
