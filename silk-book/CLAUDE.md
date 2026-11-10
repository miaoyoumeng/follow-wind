# CLAUDE.md

构建一个跨平台桌面应用（Windows / macOS / Linux），使用 Electron 作为主框架

## 1. 技术栈

#### 语言框架

- 构建工具: Vite
- 开发语言: TypeScript (Strict Mode)。
- 核心框架: Vue 3 (必须使用 Composition API)。
- 包管理器: 强制使用 **pnpm**，禁用 npm

#### vue 开发规范
- **路由**: Vue Router
- **UI 组件库**: TDesign Vue Next 1.18+

#### electron 框架
- electron
- IPC 通信规范（IPC Rules）, 模块名:动作:具体功能， 例如 `gitbook:render:navigators`
```typescript
// src/app/preload.cjs
contextBridge.exposeInMainWorld('electronApi', {
  renderGitBookTree: () => {
    return ipcRenderer.invoke('gitbook:render:navigators');
  },
  renderMarkdown: (mdPath) => {
    return ipcRenderer.invoke('gitbook:render:markdown', mdPath);
  },
  renderImage: (imagePath, current)=> {
    return ipcRenderer.invoke('gitbook:render:image', imagePath, current)
  }
})

// src/app/index.ts
ipcMain.handle('store:get:key', (_, key) => {
    return configStore.get(key);
  });
```
- 规则
    - 禁止直接暴露 Node API 到 renderer
    - 所有通信必须通过 preload
    - 使用 invoke/handle 替代 send/on
 
## 2. 项目结构

```text
src/
   ├── assets/                         # 静态资源
   │   ├── icons/                      # SVG 图标
   │   ├── images/                     # 全局样式
   │   └── styles/                     # 全局样式
   │       ├── globals.scss            # 全局页面结构css样式
   │       ├── common.scss             # 全局页面通用css样式
   │       ├── tdesign.scss            # 全局覆盖 TDesign 原有的样式
   │       └── font.scss               # 全局字体样式
   ├── app/                            # electron desktop app 功能
   │   ├── view/                       # app 窗口功能布局组件，
   │   ├── preload.cjs                 # 网页页面与主进程安全桥接，暴露受控 API 给 pages
   │   └── index.ts                    # 主进程入口， 创建窗口（BrowserWindow），管理应用生命周期
   ├── cli/                            # 自定义 shell 命令功能
   │   ├── commander/                  # 命令功能布局组件
   │   └── index.ts                    # shell 命令 启动入口 
   ├── renderer/                       # 渲染进程代码 (前端)
   │   ├── api/                        # API 接口
   │   ├── components/                 # 公共组件
   │   ├── pages/                      # 功能页面功能，UI 渲染， 用户交互
   │   ├── routers/                    # 路由配置
   │   ├── stores/                     # Pinia 状态管理
   │   ├── utils/                      # 工具函数
   │   └── views/                      # 组成页面内各中视图组件
   ├── typings/                        # 共享TypeScript 类型定义
   ├── App.vue                         # 根组件
   └── main.ts                         # vue 入口文件
```

## 3. 注意事项

1. 新增页面需要在路由模块中注册
2. 需要权限控制的页面使用动态路由
3. 需要缓存的页面配合 keepAlive store 使用

## 4. 重要事项

1. 请 在每次内容修改后，都需要执行一下：pnpm run lint:eslint，以检查修改语法是否合规
2. 使用函数表达式（Function Expression）