import { app, BrowserWindow, ipcMain } from 'electron';
import { createMainWindow } from './views/window.js';
import { registerMacAppMenu } from './views/menu.js';
import { configStore, initConfigFile } from './store/index.js';
import { gitbookNavigators } from './gitbook/navigator.js';
import { gitbookImages, gitbookImagesBy, gitbookMarkDown } from './gitbook/markdown.js';

app.whenReady().then(() => {
  // 初始化配置文件
  initConfigFile();
  // 创建主窗口
  createMainWindow();
  // 获取 electron-store 配置
  ipcMain.handle('store:get:key', (_, key) => {
    return configStore.get(key);
  });

  // 获取 gitbook 导航节点
  ipcMain.handle('gitbook:render:navigators', () => {
    return gitbookNavigators();
  });
  // 获取 gitbook 导航节点
  ipcMain.handle('gitbook:render:markdown', (_, markdownPath) => {
    return gitbookMarkDown(markdownPath);
  });
  // 监听来自渲染进程的 'load-image' 请求
  ipcMain.handle('gitbook:render:image', (_, imagePath, current) => {
    if (imagePath.startsWith('/')) {
      return gitbookImages(imagePath);
    } else {
      return gitbookImagesBy(imagePath, current);
    }
  });

  // 注册 mac 菜单
  registerMacAppMenu();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
