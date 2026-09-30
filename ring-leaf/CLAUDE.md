# CLAUDE.md


## 项目概述

**leaf-ring** — 统一内部系统功能管理平台（后台管理系统）。基于 Vue 3 + TypeScript + Vite 构建，使用 TDesign Vue Next 组件库。业务模块：用户管理、商品管理（SPU/SKU/产品线）、营销管理、订单管理、财务管理、支付管理、投放与渠道、消息管理、系统设置、内容管理。

## 常用命令

```bash
pnpm dev              # 启动开发服务器 (端口 8000，见 vite.config.ts)
pnpm run build        # 类型检查 + 开发环境构建 (vue-tsc --noEmit && vite build)
pnpm type:check       # TypeScript 类型检查
pnpm lint:eslint      # ESLint 自动修复
pnpm lint:format      # Prettier 格式化 (开发完成标准之一)
```

## 技术栈

- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript** (strict 模式)
- **Vite 5** + **Vue Router 4** (hash 路由) + **Pinia** (persistedstate 持久化)
- **TDesign Vue Next** (唯一组件库) + **ECharts / vue-echarts**
- **Axios** (请求封装) + **SCSS** (全局变量自动注入)

## 目录结构

```
src/
├── api/                  # API 函数 (按模块拆分，如 product-line.ts)
│   └── modules/          # 各业务模块的 TypeScript 类型声明 (namespace 形式)
├── assets/
│   ├── jsons/            # Mock 数据 JSON 文件（接口就绪前替代真实请求）
│   └── styles/           # 全局样式
├── components/           # 通用组件 (ErrorMessage 400/403/404/500)
├── layouts/              # 布局框架 (classic / vertical)
├── pages/                # 静态路由页面 (login 等)
├── request/              # Axios 封装 + 拦截器 + 类型
├── routers/modules/      # staticRouter.ts + dynamicRouter.ts
├── stores/               # Pinia 状态 (user / auth / page / keepAlive)
├── styles/               # var.scss 全局变量
├── utils/                # 工具函数 (errorHandler)
├── views/                # 动态路由页面（业务页面，如 product/lines.vue）
└── main.ts               # 入口文件
```

## 工作流文档目录（只读参考，非构建产物）

项目采用「PRD → UI 设计稿 → API 文档 → Issue → 开发 → 验证」工作流：

| 目录 | 内容 |
|------|------|
| `prds/admin/` | PRD 文档（`<模块>-<页面>.prd.md`） |
| `ui/admin/` | HTML 设计稿（`<模块>-<页面>-ui.html`）+ `index.md` 索引 |
| `apis/admin/` | REST API 文档（yaml） |
| `domains/admin/` | 领域模型文档 |
| `issues/admin/` | 开发任务 Issue |
| `.claude/logs/ui-vue-validator/` | UI-Vue 视觉验证报告与截图 |

## 核心架构

### 路由机制 — 静态 + 动态混合

- **静态路由** (`staticRouter.ts`): 登录页、主框架、错误页面。页面写在 `src/pages/` 下。
- **动态路由** (`dynamicRouter.ts`, 只读禁止修改): 登录后从后端获取菜单，通过 `import.meta.glob` 映射 `src/views/**/*.vue` 组件。
- **路由页面命名规则**: 路由 `/product/lines` → `src/views/product/lines.vue`。禁止 `index.vue` 子目录模式（唯一例外：路由本身以 `/index` 结尾）。页面文件必须通过 `uv run python scripts/vue-route.py --route=<路由路径>` 创建。
- **路由注册源头**: `src/assets/jsons/dynamic-router.json`（禁止修改，同时存在于 `src/assets/jsons/dynamic-routers.json` 供 API mock 使用）。
- **路由守卫**: 白名单放行 → 无 token 跳转登录 → 加载动态路由。路由模式由 `VITE_ROUTER_MODE` 切换 hash/history。

### API 分层规范

三层结构，禁止在组件中直接调用 API：

1. `src/api/modules/<模块>.ts` — 类型声明（`export declare namespace Xxx { interface ... }`）
2. `src/api/<模块>.ts` — API 函数定义，返回 `Promise<ResultData<T>>`；开发阶段从 `src/assets/mocks/` 读取静态 JSON mock（标注 TODO 待替换为真实 HTTP 请求）
3. `src/views/<模块>/<页面>.vue` — 页面中引用 API 函数

统一返回结构：`{ code, msg, data }`（`request/modules.ts` 中的 `ResultData`）。新页面开发必须先创建 JSON mock 再写交互。

### 请求层

- `request/request.ts`: `RequestHttp` 类封装 Axios，请求拦截自动注入 `Authorization` (userStore.token)，响应拦截按 `code` 处理 200/401/403/500
- `request/index.ts`: 导出的 `http` 实例；`request/modules.ts`: 类型定义
- 开发环境 `/api` 代理指向 `https://m1.apifoxmock.com/m1/8520177-8294671-default`（vite.config.ts）

### 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_API_URL` | API 基础地址 |
| `VITE_GLOB_APP_TITLE` | 应用标题 |
| `VITE_ROUTER_MODE` | 路由模式 (hash/history) |
| `VITE_PORT` | 开发服务器端口 |

### 路径别名与样式

- `@` → `src/` (配置于 `tsconfig.json` 和 `vite.config.ts`)
- 全局 SCSS 变量通过 vite `additionalData` 自动注入 `@/styles/var.scss`；只有全局变量才能写在该文件，单页样式禁止写入
