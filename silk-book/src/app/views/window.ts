import { BrowserWindow, globalShortcut, shell } from 'electron';
import path from 'path';
import url, { fileURLToPath } from 'url';

import { env } from '../utils/env.js';
import { setWindowConfig, getWindowConfig } from '../store/index.js';
// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 创建主窗口
export const createMainWindow = (): BrowserWindow | null => {
  const initRectangle = { width: 1440, height: 800, x: 0, y: 0 };
  const configRectangle = getWindowConfig();
  const showRectangle = {
    ...initRectangle,
    ...configRectangle
  };
  // Create the browser window.
  const mainWindow: BrowserWindow = new BrowserWindow({
    ...showRectangle,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    frame: true,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      spellcheck: false, // 禁用拼写检查器
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.cjs')
    }
  });
  // and load the index.html of the app.
  mainWindow.show();

  //加载主进程前端资源
  loadMainResource(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 注册快捷键Ctrl+Shift+I打开开发者工具
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow.webContents.openDevTools();
  });

  mainWindow.on('resize', () => {
    setWindowConfig(mainWindow.getBounds());
  });

  mainWindow.on('move', () => {
    setWindowConfig(mainWindow.getBounds());
  });
  mainWindow.on('minimize', () => {
    mainWindow.minimize();
    setWindowConfig(mainWindow.getBounds());
  });

  return mainWindow;
};

/**
 * 加载主进程前端资源
 * @param {*} mainWindow
 */
const loadMainResource = (mainWindow: BrowserWindow) => {
  if (env.isDev) {
    mainWindow.webContents.openDevTools();
    // 监听应用程序根路径下的所有文件，当文件发生修改时，自动刷新应用程序
    // require('electron-reload')(path.join(__dirname, '..'));
  }
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, '../..', '/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );
};
