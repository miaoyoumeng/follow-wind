import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

describe('Preload Script', () => {
  const preloadPath = join(rootDir, 'src/app/preload.ts');
  const preloadContent = readFileSync(preloadPath, 'utf-8');

  it('应该导入 electron 模块', () => {
    expect(preloadContent).toContain("import { contextBridge, ipcRenderer } from 'electron'");
  });

  it('应该导入 platform 工具', () => {
    expect(preloadContent).toContain("import { platform } from './utils/platform");
  });

  it('应该监听 DOMContentLoaded 事件', () => {
    expect(preloadContent).toContain("addEventListener('DOMContentLoaded'");
  });

  it('应该使用 contextBridge 暴露 API', () => {
    expect(preloadContent).toContain('contextBridge.exposeInMainWorld');
    expect(preloadContent).toContain("'electronApi'");
  });

  it('应该暴露 openFile 方法', () => {
    expect(preloadContent).toContain('openFile');
    expect(preloadContent).toContain('ipcRenderer.invoke');
  });

  it('应该暴露 quitApp 方法', () => {
    expect(preloadContent).toContain('quitApp');
  });

  it('应该暴露 setBaseURL 方法', () => {
    expect(preloadContent).toContain('setBaseURL');
  });

  it('应该暴露 setForceQuitCode 方法', () => {
    expect(preloadContent).toContain('setForceQuitCode');
  });

  it('应该暴露 setMaximize 方法', () => {
    expect(preloadContent).toContain('setMaximize');
  });

  it('应该暴露 closeWindow 方法', () => {
    expect(preloadContent).toContain('closeWindow');
  });

  it('应该暴露 minimizeWindow 方法', () => {
    expect(preloadContent).toContain('minimizeWindow');
  });

  it('应该暴露 getPlatform 方法', () => {
    expect(preloadContent).toContain('getPlatform');
    expect(preloadContent).toContain('return platform');
  });
});
