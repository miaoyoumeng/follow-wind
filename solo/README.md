# solo

通过 tmux 管理多个 Claude 命令窗口的 CLI 工具。允许用户在同一个终端中运行多个独立的 Claude 会话。

## 依赖要求

- Node.js >= 22.0.0
- tmux（系统安装）
- claude CLI（系统安装）

## 安装

```bash
pnpm install
pnpm build
```

## 项目目录结构

```
src/
├── bin/solo.ts           # CLI 入口，使用 commander 解析命令
├── claude/               # Claude 启动逻辑
├── commander/            # 子命令实现
├── config/               # 统一路径配置
├── core/                 # 公共逻辑
│   ├── checker/          # 环境检测模块（settings、claude、tmux）
│   ├── ini/              # INI 配置文件读写
│   └── version.ts        # 版本信息
└── tmux/                 # tmux 会话管理（创建、附加、终止、检测）
```

TypeScript 构建后输出到 `dist/` 目录，可执行文件为 `dist/bin/solo.js`。

## 使用

```bash
solo init                # 检查环境并创建 .solo/config
solo version             # 检查环境，显示 solo 版本
solo status              # 检查工作目录是否为合规的 solo 工作区
solo start               # 启动本项目的 tmux session（不存在则创建，已存在则进入）
solo stop                # 终止本项目的 tmux session
solo dashboard           # 进入本项目的 tmux session
```

## 开发

```bash
pnpm dev                 # 监听模式编译
pnpm test                # 运行测试
pnpm run format          # Prettier 格式化 + ESLint 检查
```

## 许可证

MIT
