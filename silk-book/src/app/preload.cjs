const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => {
    return ipcRenderer.invoke('store:get:key', key);
  }
});
contextBridge.exposeInMainWorld('electronApi', {
  // 获取 gitbook 中 SUMMARY.md 定义的左侧导航菜单
  renderGitBookTree: () => {
    return ipcRenderer.invoke('gitbook:render:navigators');
  },
  // 获取 gitbook 中 mdPath 定义的内容渲染页面
  renderMarkdown: (mdPath) => {
    return ipcRenderer.invoke('gitbook:render:markdown', mdPath);
  },
  renderImage: (imagePath, current)=> {
    return ipcRenderer.invoke('gitbook:render:image', imagePath, current)
  }
});