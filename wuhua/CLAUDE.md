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
├── agents/       # Agent 配置解析与 tmux 布局编排
├── bin/          # CLI 入口，commander 注册所有子命令
├── bootstrap/    # 常驻进程 daemon 管理（PID 文件、心跳、IPC 调度）
├── claude/       # Claude 进程启动与干预检测
├── cli/          # 子命令实现（每个子命令一个目录）
├── config/       # 统一路径配置（.solo、.solo/config 等常量）
├── envs/         # 环境检测（settings、claude、tmux）
├── hooks/        # tmux hooks 注册与回调实现
├── ipc/          # IPC 通信（roller 轮询、daemon 消息处理）
├── logging/      # 日志模块
├── process/      # 进程级操作（wait 等待 pane 空闲）
├── task/         # 任务管理（注册、状态流转、存储、轮询循环）
├── tmux/         # tmux 操作封装（纯命令调用，无业务逻辑）
└── utils/        # 通用工具（文件 IO、时间、YAML 读写等）
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

- 子命令实现都在 `src/cli/`，每个命令一个目录。
- 业务逻辑（如 `src/agents`、`src/tmux`、`src/claude`）各自独立顶级目录。
- 所有约定的文件路径（如 `.solo`、`.solo/config.yaml`）统一在 `src/config/` 定义，其他地方引用。

### 模块入口（index.ts）

每个模块目录必须有 `index.ts`，作为唯一对外 export 入口，集中 re-export 该模块的函数、类型。参考 `src/agents/index.ts`。

### 类型定义（types.ts）

每个模块的 `interface` 和 `type` 都定义在该模块的 `types.ts` 文件中，不在业务文件里内联定义。参考 `src/agents/types.ts`。

### 命令开发规则

除 `init`、`version`、`status` 外，其他命令必须先调用 `validateWorkspace`（来自 `src/cli/status`）验证工作区合规性，再执行业务逻辑。

### 日志规范

- `console.log`（及其他 `console.*`）只能出现在 `src/cli/` 目录下的文件中，用于向用户输出终端信息。
- `src/cli/` 以外的所有代码，禁止使用 `console.*`，必须使用 `logger`（来自 `src/logging`）的 `logger.trace`、`logger.debug`、`logger.info`、`logger.warn`、`logger.error` 方法记录日志。
- 引入 `logger`：`import { logger } from '../logging';`（路径根据文件位置调整）。
- 直接调用 `logger.trace`、`logger.debug`、`logger.info`、`logger.warn`、`logger.error` 即可，tslog 内部会根据 `minLevel` 配置自动过滤低级别日志，无需调用方判断。禁止封装日志守卫为公共方法。

## TypeScript 规范

- 参考 `eslint` 和 `prettier` 配置。
- 使用 interface 定义对象结构、类契约或扩展（extends），优先用 interface 表达公开 API；使用 type 定义联合类型、元组、映射类型或工具类型，用 type 处理内部组合。
- 弃用 enum，改用联合类型或常量对象，使用 `type Status = 'pending' | 'success' | 'error'` 表达有限集合。需要映射值时，用 const 对象 + as const 配合 keyof typeof 推导。
- 使用 `as const` 定义常量对象，确保类型推断为字面量类型而非宽泛类型。
- 布尔值命名：布尔类型的变量或状态，应使用 is、has、can、should 等前缀，使语义更清晰（如 `isLoading`）。
- 使用 `function` 声明顶层函数和类方法；使用箭头函数作为回调、闭包或需要保留 `this` 上下文的内联函数。禁止强制统一使用箭头函数。
- 函数定义中的每个参数都需要有注解。如`@param [name]  [description]`
- 安全访问与默认值：使用可选链（?.）处理可能为 null/undefined 的属性访问，使用空值合并（??）提供默认值，替代 && 链或 ||（避免将 0、'' 等 falsy 值误判）。
- 所有需要对外 `export` 的 function、interface、type，都在文件名为 `index.ts` 中 export。 参考代码`src/agents/index.ts`
- 模块中所有的 interface、type，都在文件名为 `types.ts` 中定义好。参考代码`src/agents/types.ts`

## 测试规范

- 禁止编写文件名为 `types.ts` 和 `index.ts` 对应的单元测试（它们只包含类型定义或 re-export，无可测试行为）。
- 禁止编写仅验证日志输出（`debug`/`info`/`warn`/`error` 调用次数、参数、颜色）的单元测试。日志是副作用，不是行为。测试应关注函数的返回值、状态变更或外部调用，而非日志是否被打印。如果一个测试的全部断言都是 `expect(mockLog).toHaveBeenCalled(...)`，则该测试无意义，应删除。
- 只 Mock 边界：网络、数据库、文件系统、时间、随机数、第三方 API 等外部依赖才 Mock；禁止 Mock 被测函数或类本身。
- 优先依赖注入：通过构造函数、参数或工厂注入接口依赖，优于 `vi.mock` 整个模块。
- Mock 必须遵守真实契约：返回值、异常、Promise、副作用须与真实依赖一致，用接口/类型约束，禁止「测试通过但生产失败」。
- 选最轻的替身：fake > stub > spy > 完整 mock；避免创建庞大万能 Mock。
- 类型安全创建 Mock：使用 `vi.mocked<T>`、`MockedFunction<T>`、`Partial<T>`；禁止 `as any` 和强制类型断言。
- 只断言可观察行为：测试公共 API、返回值、状态变化和必要副作用；禁止断言私有方法、内部调用顺序或实现步骤。
- 交互断言要克制：只有副作用、命令、通知等真正重要时才验证调用参数和次数；查询/计算逻辑优先断言返回结果。
- 每个测试独立且可重复：`beforeEach` 新建 Mock，`afterEach` restore/reset/clear；禁止共享可变 Mock 状态。
- 封装第三方依赖为适配器：Mock 自己定义的适配器接口，不直接 Mock 第三方库内部 API。
- 保持确定、快速、可读：避免真实网络/时间/随机性；遵循 AAA（Arrange-Act-Assert）；命名说明行为而非实现。
- 测试不得依赖 `.solo/config.yaml`。测试环境通过 `test/setup.ts`（vitest setupFiles）将配置路径切换为 `.solo/config-test.yaml`，确保 `pnpm run test` 不触及真实运行环境。新增涉及配置文件的测试时，同样依赖此机制，禁止读写 `.solo/config.yaml`。
