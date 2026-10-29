# solo

类似 claude 的 ai agent。

## 依赖要求

- Node.js >= 22.0.0

## 安装

```bash
pnpm install
pnpm build
```

## 项目目录结构

```
src/
├── bin/solo.ts           # CLI 入口，使用 commander 解析命令
├── cli/                  # 子命令
├── commander/            # 斜杆命令
├── config/               # 统一路径配置（.solo/config.yaml 等常量）
└── logging/              # 日志模块（level 过滤 + 文件输出）
```

TypeScript 构建后输出到 `dist/` 目录，可执行文件为 `dist/bin/solo.js`。


## 命令

### 环境管理

```bash
solo version                         # 检查环境，显示 solo 版本
solo doctor                          # 检查工作目录是否为合规的 solo 工作区
```


