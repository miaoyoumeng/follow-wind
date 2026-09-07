# CLAUDE.md

## 项目概述

`solo` 是一个 Node.js CLI 工具，通过 `tmux` 管理多个 Claude 命令窗口。允许用户同时运行多个独立的 Claude 会话。

## 开发命令

```bash
pnpm install             # 安装依赖（首次）
pnpm build               # 构建 TypeScript
pnpm dev                 # 监听模式编译
pnpm test                # 运行测试
pnpm run format          # Prettier 格式化代码和 ESLint 检查并自动修复
```

每次内容变更后，必须执行：`pnpm run format && pnpm build && pnpm run test`

## 业务命令

```bash
solo init                # 检查并创建 .solo/config，检测 claude/tmux
solo version             # 检查环境，显示 solo 版本
solo status              # 检查工作目录是否为合规的 solo 工作区
solo start               # 启动本项目的 tmux session（不存在则创建，已存在则进入）
solo stop                # 终止本项目的 tmux session
solo dashboard           # 进入本项目的 tmux session
solo agents              # 显示 .solo/config 中的 agent 列表
solo agent <args...>     # agent 管理（add <name> <path> | <name> workspace | <name> panes）
solo windows             # 显示当前 session 中的 windows
```

## 目录结构

```
src/
├── bin/solo.ts                  # CLI 入口，commander 注册所有子命令
├── commander/                   # 子命令实现（每个子命令一个目录）
├── config/                      # 统一路径配置（.solo、.solo/config 等常量）
│   ├── index.ts                 # 模块入口（re-export）
│   └── paths.ts                 # 路径常量定义
├── core/                        # 公共逻辑（无业务含义的工具模块）
│   ├── agents/                  # Agent 配置解析与 tmux 布局编排
│   ├── checker/                 # 环境检测（settings、claude、tmux）
│   ├── yaml/                    # .solo/config YAML 配置文件读写
│   └── version.ts               # 读取 package.json 版本号
├── tmux/                        # tmux 操作封装（纯命令调用，无业务逻辑）
└── claude/                      # Claude 进程启动逻辑
```

TypeScript 构建后输出到 `dist/` 目录，可执行文件为 `dist/bin/solo.js`。

## 业务概念

### Agent（代理）

Agent 是 solo 管理的基本工作单元，每个 agent 对应一个 tmux window，在这个 window 中会启动一个 claude agent，用于 ai agent工作。

### Pane（面板）

允许在一个 tmux window 内创建多个 pane，每个 pane 可指定一个 tag 名称（工作场景）。利用 tmux 的分屏功能，通过创建多个 pane 执行不同类型的任务。

**特殊 tag：`claude`**
当 pane 的 tag 值为 `'claude'`（精确匹配）时，solo 会在该 pane 的工作目录执行 `claude` 命令

## 代码约定

### 目录与文件

- 子命令实现都在 `src/commander/`，每个命令一个目录。
- 公共逻辑放 `src/core/`，业务模块（如 `agents`、`tmux`、`claude`）各自独立顶级目录。
- 所有约定的文件路径（如 `.solo`、`.solo/config`）统一在 `src/config/` 定义，其他地方引用。

### 模块入口（index.ts）

每个模块目录必须有 `index.ts`，作为唯一对外 export 入口，集中 re-export 该模块的函数、类型。参考 `src/agents/index.ts`。

### 类型定义（types.ts）

每个模块的 `interface` 和 `type` 都定义在该模块的 `types.ts` 文件中，不在业务文件里内联定义。参考 `src/agents/types.ts`。

### 命令开发规则

除 `init`、`version`、`status` 外，其他命令必须先调用 `validateWorkspace`（来自 `src/commander/status`）验证工作区合规性，再执行业务逻辑。

### 核心流程

1. `solo init` → 创建 `.solo/config`，写入 `name`
2. `solo start` → 读取配置 → tmux session 不存在则创建，已存在则附加；按 `panes` 配置分屏并设置标题，tag 为 `claude` 的 pane 自动启动 claude 并处理信任提示
3. `solo stop` → 终止 session
4. `solo dashboard` → 附加到 session（维持终端状态）

## TypeScript 规范

- 禁止使用 `any`；第三方库无类型声明时优先 `declare module` 或 `unknown` + 类型守卫，最后才允许 `any` 且限定作用域。
- `interface` 定义对象结构/类契约；`type` 定义联合类型、元组、映射类型。
- 弃用 `enum`，改用联合类型或 `const` 对象 + `as const`。
- 命名：变量/函数 camelCase，常量 UPPER_SNAKE_CASE，类/接口/类型 PascalCase；布尔值用 is/has/can/should 前缀。
- 顶层函数用 `function` 声明；箭头函数用于回调、闭包。
- 安全访问：可选链（`?.`）+ 空值合并（`??`），替代 `&&` 链或 `||`。
- 类型导入用 `import { value, type Type }` 内联语法；纯类型用 `import type`。

