import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as CommanderType from 'commander';
import type * as CommanderModuleType from '../../src/cli';

const {
  mockGetLoggingConfig,
  mockSetup,
  mockRunStart,
  mockRunCapture,
  mockRunChat,
  mockRunUsage,
  mockRunHook,
  mockRunStory,
  mockRunPrompt,
  mockRunAgent,
  registeredPrograms
} = vi.hoisted(() => ({
  mockGetLoggingConfig: vi.fn(),
  mockSetup: vi.fn(),
  mockRunStart: vi.fn(),
  mockRunCapture: vi.fn(),
  mockRunChat: vi.fn(),
  mockRunUsage: vi.fn(),
  mockRunHook: vi.fn(),
  mockRunStory: vi.fn(),
  mockRunPrompt: vi.fn(),
  mockRunAgent: vi.fn(),
  registeredPrograms: [] as unknown[]
}));

// commander 是外部 CLI 框架：用真实 Command 子类替换，保留全部链式 API 以便断言注册结果。
// 只把 parse 置为空操作 —— src/bin/wuhua 在模块顶层调用它，真实解析会执行命令并终止测试进程；
// parseAsync 保持真实实现，供测试主动驱动解析。
vi.mock('commander', async importOriginal => {
  const actual = await importOriginal<typeof CommanderType>();
  class RecordingCommand extends actual.Command {
    constructor(name?: string) {
      super(name);
      this.exitOverride();
      this.configureOutput({ writeOut: () => {}, writeErr: () => {} });
      registeredPrograms.push(this);
    }
    parse(): this {
      return this;
    }
  }
  return { ...actual, Command: RecordingCommand };
});

// 各命令实现是副作用边界，mock 以隔离注册层并断言参数是否正确传递
vi.mock('../../src/cli', async importOriginal => {
  const actual = await importOriginal<typeof CommanderModuleType>();
  return {
    ...actual,
    runStart: mockRunStart,
    runCapture: mockRunCapture,
    runChat: mockRunChat,
    runUsage: mockRunUsage,
    runHook: mockRunHook,
    runStory: mockRunStory,
    runPrompt: mockRunPrompt,
    runAgent: mockRunAgent
  };
});

// logging 模块是上层业务依赖，mock 以隔离 initLogger 的初始化逻辑
vi.mock('../../src/logging', () => ({
  getLoggingConfig: mockGetLoggingConfig,
  setup: mockSetup,
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  } as unknown
}));

import { initLogger } from '../../src/bin/wuhua';

/** 从捕获的 program 上读取注册结果的只读视图 */
interface RegisteredCommand {
  name(): string;
  description(): string;
  _hidden?: boolean;
  readonly registeredArguments: ReadonlyArray<{ name(): string; required: boolean }>;
  readonly options: ReadonlyArray<{ flags: string; required: boolean }>;
}

const program = registeredPrograms[0] as unknown as {
  name: () => string;
  commands: RegisteredCommand[];
  parseAsync: (args: string[]) => Promise<void>;
};
const findCommand = (name: string): RegisteredCommand | undefined => program.commands.find(c => c.name() === name);

/** [命令名, 描述] —— 与重构前的 --help 输出逐字对应，是本次重构的可移植契约 */
const EXPECTED_COMMANDS: ReadonlyArray<[string, string]> = [
  ['init', '检查并初始化环境'],
  ['version', '检查环境并显示版本'],
  ['doctor', '诊断环境和配置'],
  ['status', '检查工作目录是否为合规的 wuhua 工作区'],
  ['start', '启动本项目的 tmux session'],
  ['stop', '终止本项目的 tmux session'],
  ['dashboard', '进入本项目的 tmux session'],
  ['usage', '统计指定 agent 的 Claude token 消耗'],
  ['chat', '向指定 agent 的 claude pane 发送消息'],
  ['hook', 'hook 回调入口（由 tmux run-shell 自动调用）'],
  ['capture', '捕获指定 agent 面板内容并写入 .wuhua/capture/'],
  ['story', '依据 feature 文件为主题生成 user story prompt'],
  ['prompt', '按 prompts 索引中的 todo 列表逐条执行 prompt'],
  ['agent', '把 shell 命令提交到 agent 的 tmux pane 执行']
];

describe('项目名', () => {
  it('program 名称为 wuhua', () => {
    expect(program.name()).toBe('wuhua');
  });
});

describe('initLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('配置 logging 段时，调用 setup 初始化日志模块', () => {
    mockGetLoggingConfig.mockReturnValue({ level: 'debug', file: '/tmp/wuhua.log' });
    initLogger();
    expect(mockSetup).toHaveBeenCalledWith({ level: 'debug', file: '/tmp/wuhua.log' });
  });

  it('未配置 logging 段时，仍调用 setup（getLoggingConfig 已补充默认值）', () => {
    mockGetLoggingConfig.mockReturnValue({ level: 'warn', file: '/default/.wuhua/wuhua.log' });
    initLogger();
    expect(mockSetup).toHaveBeenCalledWith({ level: 'warn', file: '/default/.wuhua/wuhua.log' });
  });
});

describe('命令注册', () => {
  // commander 在 parse 期间惰性注入 help 子命令，此处排除以聚焦 --help 可见命令
  const businessCommands = (): string[] =>
    program.commands.filter(c => c.name() !== 'help' && !c._hidden).map(c => c.name());

  it('注册全部 14 个业务命令，且顺序与 --help 输出一致', () => {
    expect(businessCommands()).toEqual(EXPECTED_COMMANDS.map(([name]) => name));
  });

  it.each(EXPECTED_COMMANDS)('命令 %s 的描述为「%s」', (name, description) => {
    const cmd = findCommand(name);
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toBe(description);
  });
});

describe('参数元数据', () => {
  it('usage：<agent-name> 必填，[date] 可选', () => {
    const args = findCommand('usage')?.registeredArguments ?? [];
    expect(args.map(a => a.name())).toEqual(['agent-name', 'date']);
    expect(args.map(a => a.required)).toEqual([true, false]);
  });

  it('chat：--agent 与 --prompt 均必填，且不声明位置参数', () => {
    const cmd = findCommand('chat');
    expect(cmd?.registeredArguments ?? []).toEqual([]);
    const options = cmd?.options ?? [];
    expect(options.map(o => o.flags)).toEqual(['--agent <agent>', '--prompt <prompt>']);
    expect(options.map(o => (o as unknown as { mandatory: boolean }).mandatory)).toEqual([true, true]);
  });

  it('capture：agent-name 与 pane-index 均必填', () => {
    const args = findCommand('capture')?.registeredArguments ?? [];
    expect(args.map(a => a.name())).toEqual(['agent-name', 'pane-index']);
    expect(args.map(a => a.required)).toEqual([true, true]);
  });

  it('hook：endpoint 必填，其余参数可选', () => {
    const options = findCommand('hook')?.options ?? [];
    expect(options.map(o => o.flags)).toEqual(['--endpoint <endpoint>', '--event <event>', '--workspace <workspace>']);
    // endpoint 必填（mandatory），其余可选
    // 注：commander 的 required 表示选项是否需要参数值，mandatory 才是是否必填
    expect(options.map(o => (o as unknown as { mandatory: boolean }).mandatory)).toEqual([true, false, false]);
  });

  it('story：--agent 与 --file 均必填，且不声明位置参数', () => {
    const cmd = findCommand('story');
    expect(cmd?.registeredArguments ?? []).toEqual([]);
    const options = cmd?.options ?? [];
    expect(options.map(o => o.flags)).toEqual(['--agent <agent>', '--file <path>']);
    expect(options.map(o => (o as unknown as { mandatory: boolean }).mandatory)).toEqual([true, true]);
  });

  it('prompt：--agent 必填，--timeout 可选，且不声明位置参数', () => {
    const cmd = findCommand('prompt');
    expect(cmd?.registeredArguments ?? []).toEqual([]);
    const options = cmd?.options ?? [];
    expect(options.map(o => o.flags)).toEqual(['--agent <agent>', '--timeout <minutes>']);
    expect(options.map(o => (o as unknown as { mandatory: boolean }).mandatory)).toEqual([true, false]);
  });

  it('agent：--name 与 --bash 必填，--pane-index 可选，且不声明位置参数', () => {
    const cmd = findCommand('agent');
    expect(cmd?.registeredArguments ?? []).toEqual([]);
    const options = cmd?.options ?? [];
    expect(options.map(o => o.flags)).toEqual(['--name <name>', '--pane-index <index>', '--bash <command>']);
    expect(options.map(o => (o as unknown as { mandatory: boolean }).mandatory)).toEqual([true, false, true]);
  });

  it('无参数命令不声明位置参数', () => {
    const args = findCommand('status')?.registeredArguments ?? [];
    expect(args).toEqual([]);
  });
});

describe('命令执行', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // commander 会在声明的参数之后追加 options 与 command 对象（lib/command.js:534-540）；
  // 各命令实现按固定元数接收，多余参数被忽略，故断言前 N 个实参
  it('capture：pane-index 经 parseInt 转为 number 后传入', async () => {
    await program.parseAsync(['node', 'wuhua', 'capture', 'myagent', '3']);
    expect(mockRunCapture.mock.calls[0].slice(0, 2)).toEqual(['myagent', 3]);
  });

  it('chat：--agent 与 --prompt 选项按序映射为实参', async () => {
    await program.parseAsync(['node', 'wuhua', 'chat', '--agent', 'myagent', '--prompt', 'hello world']);
    expect(mockRunChat.mock.calls[0].slice(0, 2)).toEqual(['myagent', 'hello world']);
  });

  it('usage：省略日期时第二个参数为 undefined', async () => {
    await program.parseAsync(['node', 'wuhua', 'usage', 'myagent']);
    expect(mockRunUsage.mock.calls[0][0]).toBe('myagent');
    expect(mockRunUsage.mock.calls[0][1]).toBeUndefined();
  });

  it('hook：选项映射为回调参数', async () => {
    await program.parseAsync(['node', 'wuhua', 'hook', '--endpoint', 'tmux', '--event', 'alert-bell']);
    expect(mockRunHook).toHaveBeenCalledWith({
      endpoint: 'tmux',
      event: 'alert-bell',
      workspace: undefined
    });
  });

  it('story：--agent 与 --file 按序传入 runStory', async () => {
    await program.parseAsync(['node', 'wuhua', 'story', '--agent', 'console', '--file', '/spec/feature.json']);
    expect(mockRunStory).toHaveBeenCalledWith('console', '/spec/feature.json');
  });

  it('prompt：--agent 传入 runPrompt，省略 --timeout 时为 undefined', async () => {
    await program.parseAsync(['node', 'wuhua', 'prompt', '--agent', 'console']);
    expect(mockRunPrompt).toHaveBeenCalledWith('console', undefined);
  });

  it('prompt：--timeout 经 parseInt 转为 number 后传入', async () => {
    await program.parseAsync(['node', 'wuhua', 'prompt', '--agent=all', '--timeout=30']);
    expect(mockRunPrompt).toHaveBeenCalledWith('all', 30);
  });

  it('agent：--name 与 --bash 传入 runAgent，省略 --pane-index 时为 undefined', async () => {
    await program.parseAsync(['node', 'wuhua', 'agent', '--name=all', '--bash=pnpm test']);
    expect(mockRunAgent).toHaveBeenCalledWith('all', undefined, 'pnpm test');
  });

  it('agent：--pane-index 经 parseInt 转为 number 后传入', async () => {
    await program.parseAsync(['node', 'wuhua', 'agent', '--name=console', '--pane-index=2', '--bash=git pull']);
    expect(mockRunAgent).toHaveBeenCalledWith('console', 2, 'git pull');
  });

  it('agent：多余参数报错，不执行 runAgent（allowExcessArguments=false 生效）', async () => {
    await expect(program.parseAsync(['node', 'wuhua', 'agent', '--name=all', '--bash=pwd', 'extra'])).rejects.toThrow(
      /too many arguments/
    );
    expect(mockRunAgent).not.toHaveBeenCalled();
  });

  it('start：多余参数报错，不执行 runStart（allowExcessArguments=false 生效）', async () => {
    await expect(program.parseAsync(['node', 'wuhua', 'start', 'extra'])).rejects.toThrow(/too many arguments/);
    expect(mockRunStart).not.toHaveBeenCalled();
  });
});
