# CLAUDE.md

## 项目概述

`solo` 是一个 Node.js CLI 工具，通过 `tmux` 管理多个 Claude 命令窗口。允许用户同时运行多个独立的 Claude 会话。

## 常用命令

```bash
# 安装依赖（首次）
pnpm install

# 构建 TypeScript
pnpm build

# 初始化环境
solo init                # 检查并创建 .solo/config，检测 claude/tmux

# 检查环境并显示版本
solo version             # 检查环境，显示 solo 版本

# 启动新会话
solo start [name]        # 启动会话，可选指定名称
solo start -d /path      # 指定工作目录

# 管理会话
solo list                # 列出所有活动会话
solo kill <name>         # 终止指定会话

# 开发
pnpm dev                 # 监听模式编译
pnpm test                # 运行测试
```

## 架构说明

```
src/
├── bin/solo.ts           # CLI 入口，使用 commander 解析命令
├── commander/            # 所有子命令实现
│   ├── init/index.ts     # solo init 命令
│   └── version/index.ts  # solo version 命令
├── core/                 # 公共逻辑和业务代码
│   ├── checker/          # 环境检测模块
│   └── config/           # INI 配置文件管理
├── tmux/index.ts         # tmux 会话管理（创建、列出、终止）
└── claude/index.ts       # Claude 启动逻辑
```
TypeScript 构建后输出到 `dist/` 目录，可执行文件为 `dist/bin/solo.js`。

**重要规则：**
- 子命令都创建在 `src/commander/` 目录中。
- 公共逻辑和业务代码放在 `src/core/` 目录中。

### 核心流程

1. `solo start` → 创建 tmux 会话 → 发送 `claude` 命令启动
2. 每个会话独立运行在各自的 tmux 窗口中
3. 通过 tmux session name 标识和管理会话

## 依赖要求

- Node.js >= 22.0.0
- tmux（系统安装）
- claude CLI（系统安装）
