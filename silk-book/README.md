# Silk Book

> 基于 Electron + Vue 3 + TypeScript 的桌面端 Markdown 阅读应用

## 项目简介

Silk Book 是一款优雅的桌面端 Markdown 阅读应用，提供流畅的阅读体验和简洁的界面设计。支持 Markdown 文件的导入、目录导航、多语言切换等功能。

## 技术栈

### 核心框架

| 技术 | 版本 | 描述 |
|------|------|------|
| **Node.js** | 22.0+ | 运行时环境 |
| **TypeScript** | 5.9+ | 类型系统 |
| **Vue** | 3.5+ | 前端框架 |
| **Electron** | 36.3+ | 桌面应用框架 |

### UI 与状态管理

- **TDesign Vue Next** - 企业级 UI 组件库
- **Pinia** - Vue 3 官方状态管理
- **Vue Router** - 路由管理
- **Vue I18n** - 国际化支持

### 构建工具

- **Vite** - 下一代前端构建工具
- **pnpm** - 快速、节省空间的包管理器

## 功能特性

- [x] **Markdown 阅读** - 优雅的 Markdown 文件阅读体验
- [x] **目录导航** - 支持 Markdown 文件目录树展示
- [x] **多语言支持** - 中英文国际化切换
- [x] **Electron 桌面应用** - 跨平台桌面端支持
- [x] **CLI 工具** - 命令行工具支持
- [x] **TDesign UI** - 现代化界面设计

## 快速开始

### 环境要求

确保您的开发环境满足以下要求：

- **Node.js** >= 22.0
- **pnpm** >= 10.30
- 推荐使用 **VSCode** 作为开发工具

### 开发模式

```bash
# 启动 Web 开发服务器
pnpm run serve

# 启动 Electron 桌面应用（开发模式）
pnpm run app
```

### 构建打包

```bash
# 构建生产版本
pnpm run build

# 打包 Electron 应用
pnpm run package
```

## 项目结构

```
silk-book/
    ├── src/
    │      ├── assets/                         # 静态资源
    │      │   ├── icons/                      # SVG 图标
    │      │   ├── images/                     # 全局样式
    │      │   └── styles/                     # 全局样式
    │      │       ├── globals.scss            # 全局页面结构css样式
    │      │       ├── common.scss             # 全局页面通用css样式
    │      │       ├── tdesign.scss            # 全局覆盖 TDesign 原有的样式
    │      │       └── font.scss               # 全局字体样式
    │      ├── app/                            # electron desktop app 功能
    │      │   ├── view/                       # app 窗口功能布局组件，
    │      │   ├── preload.cjs                 # 网页页面与主进程安全桥接，暴露受控 API 给 pages
    │      │   └── index.ts                    # 主进程入口， 创建窗口（BrowserWindow），管理应用生命周期
    │      ├── cli/                            # 自定义 shell 命令功能
    │      │   ├── commander/                  # 命令功能布局组件
    │      │   └── index.ts                    # shell 命令 启动入口 
    │      ├── renderer/                       # 渲染进程代码 (前端)
    │      │   ├── api/                        # API 接口
    │      │   ├── components/                 # 公共组件
    │      │   ├── pages/                      # 功能页面功能，UI 渲染， 用户交互
    │      │   ├── routers/                    # 路由配置
    │      │   ├── stores/                     # Pinia 状态管理
    │      │   ├── utils/                      # 工具函数
    │      │   └── views/                      # 组成页面内各中视图组件
    │      ├── typings/                        # 共享TypeScript 类型定义
    │      ├── App.vue                         # 根组件
    │      └── main.ts                         # 入口文件
    └── test/                                  # 测试文件目录，test目录内的子目录是src目录的镜像
```

---
## 自定义 CLI 工具

Silk Book 提供了命令行工具，支持以下功能：

```bash
# 查看版本
pnpm run version

# 查看帮助
pnpm run help

# 使用 -v 查看版本
pnpm run -v

# 使用 -h 查看帮助
pnpm run -h
```

---
## 可用命令

| 命令 | 描述 |
|------|------|
| `pnpm run serve` | 启动 Web 开发服务器 |
| `pnpm run app` | 启动 Electron 桌面应用（先构建） |
| `pnpm run build` | 构建生产版本 |
| `pnpm run package` | 打包 Electron 应用 |
| `pnpm run lint:eslint` | ESLint 代码检查 |
| `pnpm run lint:prettier` | Prettier 格式检查 |
| `pnpm run lint:format` | Prettier 格式化 |

---
