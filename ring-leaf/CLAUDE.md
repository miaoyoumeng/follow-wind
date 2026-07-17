## 项目概述

**leaf-ring** — 统一内部系统安全管理平台。基于 Vue 3 + TypeScript + Vite 构建的后台管理系统，使用 TDesign Vue Next 组件库。

## 常用命令

```bash
pnpm dev              # 启动开发服务器 (端口 8000)
pnpm run build            # 开发环境构建
pnpm type:check       # TypeScript 类型检查
pnpm lint:eslint      # ESLint 修复
pnpm lint:prettier    # Prettier 格式化
```

## 脚本工具 (claude.sh)

```bash
./claude.sh pull    # 从 SOURCE_DIR 拉取最新代码到本项目
./claude.sh push    # 将本项目代码推回 SOURCE_DIR
./claude.sh start   # 启动 Claude Code (跳过权限确认模式)
```

## 技术栈

- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript** (strict 模式)
- **Vite 5** (构建工具)
- **Vue Router 4** (动态路由 + hash/history 模式)
- **Pinia** (状态管理，启用 persistedstate 持久化)
- **TDesign Vue Next** (UI 组件库)
- **Axios** (HTTP 请求封装)
- **SCSS** (全局变量自动注入)

## 目录结构

```
src/
├── api/                  # API 接口 (login / menu / auth / modules/*)
├── assets/               # 图片 / 全局样式
├── components/           # 通用组件 (ErrorMessage 400/403/404/500)
├── layouts/              # 布局框架 (classic / vertical)
├── pages/                # 页面级组件 (login / main)
├── request/              # Axios 封装 + 拦截器
├── routers/              # 路由配置 + 动态路由
├── stores/               # Pinia 状态 (user / auth / page / keepAlive)
├── styles/               # 全局 SCSS 变量 (var.scss)
├── typings/              # TypeScript 类型声明
├── utils/                # 工具函数 (errorHandler)
├── views/                # 业务视图 (home / app / menus / error)
├── main.ts               # 入口文件
└── App.vue               # 根组件
```

## 核心架构

### 路由机制 — 静态 + 动态混合

- **静态路由** (`staticRouter.ts`): 登录页、主框架、错误页面
- **动态路由** (`dynamicRouter.ts`): 登录后从后端获取，通过 `import.meta.glob` 映射 `@/views/**/*.vue` 组件
- **路由守卫**: 白名单放行 → 无 token 跳转登录 → 加载动态路由
- 路由模式通过环境变量 `VITE_ROUTER_MODE` 切换 `hash` / `history`

### 请求层

- `request/request.ts`: `RequestHttp` 类封装 Axios
  - 请求拦截: 自动注入 `Authorization` header (`userStore.token`)
  - 响应拦截: 按 `code` 处理 200/401/403/500，401 自动清登录态跳登录页
  - 提供 `get/post/put/delete/download` 方法
- `request/index.ts`: 导出的 `http` 实例
- `request/modules.ts`: 类型定义

### 状态管理 (Pinia)

- **user**: token、用户信息 (localStorage 持久化)
- **auth**: 角色编码、动态路由列表 (localStorage 持久化)
- **page**: 布局配置
- **keepAlive**: 缓存列表

### 左侧菜单

菜单路由定义：[参考地址](https://m1.apifoxmock.com/m1/8520177-8294671-default/security/app/menus)

开发过程中在`主框架`中定义页面路由时需要参考上述内容。

### 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_API_URL` | API 基础地址 |
| `VITE_GLOB_APP_TITLE` | 应用标题 |
| `VITE_ROUTER_MODE` | 路由模式 (hash/history) |
| `VITE_PORT` | 开发服务器端口 |

### 路径别名

`@` → `src/` (配置于 `tsconfig.json` 和 `vite.config.ts`)

### 样式

- 全局 SCSS 变量通过 vite `additionalData` 自动注入: `@import '@/styles/var.scss'`。
- 只有全局的变量才能写在`@/styles/var.scss`中，禁止把单页页面功能的样式值写在这个文件中。
