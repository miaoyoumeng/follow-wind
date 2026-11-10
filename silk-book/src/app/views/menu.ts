import { app, dialog, Menu } from 'electron';
import { platform } from '../utils/platform.js';

export const registerMacAppMenu = () => {
  if (!platform.isMac) {
    Menu.setApplicationMenu(null);
    return;
  }
  const menuBar: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'SilkBook',
      submenu: [
        {
          label: `关于${app.getName()}`,
          click() {
            dialog.showMessageBox({
              title: `关于${app.getName()}`,
              message: `关于${app.getName()} v${app.getVersion()}`,
              detail:
                // 备注
                '一个开发者 AI 工具助手。集成 gitbook 文档管理、数据库管理、api管理。',
              icon: './logo/icon.png'
            });
          }
        },
        {
          label: '重新启动',
          click() {
            // 退出程序
            app.relaunch();
            app.quit();
          }
        },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click() {
            // 退出程序
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuBar));
};
