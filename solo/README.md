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
├── config/               # 统一路径配置（.solo、.solo/config、.solo/capture 等常量）
├── core/                 # 公共逻辑
│   ├── agents/           # Agent 配置解析与 tmux 布局编排
│   ├── checker/          # 环境检测模块（settings、claude、tmux）
│   ├── yaml/             # .solo/config YAML 配置文件读写
│   └── version.ts        # 版本信息
├── logging/              # 日志模块（level 过滤 + 文件输出）
└── tmux/                 # tmux 操作封装（session、window、pane、hooks）
```

TypeScript 构建后输出到 `dist/` 目录，可执行文件为 `dist/bin/solo.js`。

## 配置文件

`solo` 使用 `.solo/config`（YAML 格式）管理项目配置：

```yaml
name: my-project                    # 项目名称（作为 tmux session 名）

agents:                             # agent 定义
  frontend:
    workspace: ./apps/web           # agent 工作目录
    activate: true                  # 是否随 solo start 启动
    panes:                          # pane 分屏配置
      claude: { layout: left }      # tag 为 claude 的 pane 自动启动 claude
      shell:  { layout: right }

hooks:                              # tmux hook 注册
  alert-activity: true
  after-send-keys: true

logging:                            # 日志配置
  level: info                       # 日志级别：debug | info | warn | error
  file: .solo/solo.log              # 日志文件路径
```

## 命令

### 环境管理

```bash
solo init                            # 检查环境，创建 .solo/config（写入 name）
solo version                         # 检查环境，显示 solo 版本
solo status                          # 检查工作目录是否为合规的 solo 工作区
```

### Session 管理

```bash
solo start                           # 启动本项目 tmux session（不存在则创建，已存在则附加）
                                     # 按 agents 配置创建 window、分屏、注册 hooks
solo stop                            # 终止本项目的 tmux session
solo dashboard                       # 附加进入本项目的 tmux session
```

### Agent 管理

```bash
solo agents                          # 显示 .solo/config 中所有 agent 名称

solo agent add <name> <path>         # 添加 agent（name 为标识，path 为工作目录）
solo agent <name> workspace          # 显示指定 agent 的 workspace 路径
solo agent <name> panes              # 显示指定 agent 的 panes 配置
```

### 消息发送

```bash
solo chat <agent> <content>          # 向指定 agent 的 claude pane 发送消息
                                     # 自动定位 tag 为 claude 的 pane 并发送 content + Enter
```

### Pane 截屏

```bash
solo capture <agent-name> <pane-index>
                                     # 捕获指定 agent 的 pane 内容
                                     # 写入 .solo/capture/<agent-name>-<pane-index>.md（覆盖写）
                                     # 若距上次写入不足 30 秒，输出提示并终止（冷却保护）
```

### Hook 回调

```bash
solo hook --name <name> --session_name <s> --window_name <w> --pane_index <i>
                                     # tmux hook 回调入口（由 tmux run-shell 自动调用，不手动执行）
```

## 开发

```bash
pnpm dev                             # 监听模式编译
pnpm test                            # 运行测试
pnpm run format                      # Prettier 格式化 + ESLint 检查
```
