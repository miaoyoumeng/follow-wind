import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as CommanderType from 'commander';
import type * as CommanderModuleType from '../../src/commander';

const {
  mockGetLoggingConfig,
  mockSetup,
  mockRunStart,
  mockRunCapture,
  mockRunChat,
  mockRunUsage,
  mockRunHook,
  registeredPrograms
} = vi.hoisted(() => ({
  mockGetLoggingConfig: vi.fn(),
  mockSetup: vi.fn(),
  mockRunStart: vi.fn(),
  mockRunCapture: vi.fn(),
  mockRunChat: vi.fn(),
  mockRunUsage: vi.fn(),
  mockRunHook: vi.fn(),
  registeredPrograms: [] as unknown[]
}));

// commander 是外部 CLI 框架：用真实 Command 子类替换，保留全部链式 API 以便断言注册结果。
// 只把 parse 置为空操作 —— src/bin/solo 在模块顶层调用它，真实解析会执行命令并终止测试进程；
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
vi.mock('../../src/commander', async importOriginal => {
  const actual = await importOriginal<typeof CommanderModuleType>();
  return {
    ...actual,
    runStart: mockRunStart,
    runCapture: mockRunCapture,
    runChat: mockRunChat,
    runUsage: mockRunUsage,
    runHook: mockRunHook
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

import { initLogger } from '../../src/bin/solo';

/** 从捕获的 program 上读取注册结果的只读视图 */
interface RegisteredCommand {
  name(): string;
  description(): string;
  _hidden?: boolean;
  readonly registeredArguments: ReadonlyArray<{ name(): string; required: boolean }>;
  readonly options: ReadonlyArray<{ flags: string; required: boolean }>;
}

const program = registeredPrograms[0] as unknown as {
  commands: RegisteredCommand[];
  parseAsync: (args: string[]) => Promise<void>;
};
const findCommand = (name: string): RegisteredCommand | undefined => program.commands.find(c => c.name() === name);

/** [命令名, 描述] —— 与重构前的 --help 输出逐字对应，是本次重构的可移植契约 */
const EXPECTED_COMMANDS: ReadonlyArray<[string, string]> = [
  ['agent', 'agent 管理命令'],
  ['init', '检查并初始化环境'],
  ['version', '检查环境并显示版本'],
  ['status', '检查工作目录是否为合规的 solo 工作区'],
  ['start', '启动本项目的 tmux session'],
  ['stop', '终止本项目的 tmux session'],
  ['dashboard', '进入本项目的 tmux session'],
  ['agents', '显示 .solo/config 中的 agent 列表'],
  ['usage', '统计指定 agent 的 Claude token 消耗'],
  ['chat', '向指定 agent 的 claude pane 发送消息'],
  ['hook', 'tmux hook 回调入口（由 tmux run-shell 自动调用）'],
  ['capture', '捕获指定 agent 面板内容并写入 .solo/capture/']
];

describe('initLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('配置 logging 段时，调用 setup 初始化日志模块', () => {
    mockGetLoggingConfig.mockReturnValue({ level: 'debug', file: '/tmp/solo.log' });
    initLogger();
    expect(mockSetup).toHaveBeenCalledWith({ level: 'debug', file: '/tmp/solo.log' });
  });

  it('未配置 logging 段时，仍调用 setup（getLoggingConfig 已补充默认值）', () => {
    mockGetLoggingConfig.mockReturnValue({ level: 'warn', file: '/default/.solo/solo.log' });
    initLogger();
    expect(mockSetup).toHaveBeenCalledWith({ level: 'warn', file: '/default/.solo/solo.log' });
  });

  it('worker 进程（SOLO_WORKER=1）调用 setup 时无额外参数', () => {
    process.env.SOLO_WORKER = '1';
    mockGetLoggingConfig.mockReturnValue({ level: 'info', file: '/tmp/solo.log' });
    initLogger();
    expect(mockSetup).toHaveBeenCalledWith({ level: 'info', file: '/tmp/solo.log' });
    delete process.env.SOLO_WORKER;
  });
});

describe('命令注册', () => {
  // commander 在 parse 期间惰性注入 help 子命令，且存在隐藏命令（_task-worker），此处排除以聚焦 --help 可见命令
  const businessCommands = (): string[] =>
    program.commands.filter(c => c.name() !== 'help' && !c._hidden).map(c => c.name());

  it('注册全部 13 个业务命令，且顺序与 --help 输出一致', () => {
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

  it('chat：agent 与 content 均必填', () => {
    const args = findCommand('chat')?.registeredArguments ?? [];
    expect(args.map(a => a.name())).toEqual(['agent', 'content']);
    expect(args.map(a => a.required)).toEqual([true, true]);
  });

  it('capture：agent-name 与 pane-index 均必填', () => {
    const args = findCommand('capture')?.registeredArguments ?? [];
    expect(args.map(a => a.name())).toEqual(['agent-name', 'pane-index']);
    expect(args.map(a => a.required)).toEqual([true, true]);
  });

  it('hook：4 个选项全部必填，且保持 snake_case 名称', () => {
    const options = findCommand('hook')?.options ?? [];
    expect(options.map(o => o.flags)).toEqual([
      '--name <name>',
      '--session_name <session_name>',
      '--window_name <window_name>',
      '--pane_index <pane_index>'
    ]);
    expect(options.every(o => o.required)).toBe(true);
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
    await program.parseAsync(['node', 'solo', 'capture', 'myagent', '3']);
    expect(mockRunCapture.mock.calls[0].slice(0, 2)).toEqual(['myagent', 3]);
  });

  it('chat：两个位置参数按序传入', async () => {
    await program.parseAsync(['node', 'solo', 'chat', 'myagent', 'hello world']);
    expect(mockRunChat.mock.calls[0].slice(0, 2)).toEqual(['myagent', 'hello world']);
  });

  it('usage：省略日期时第二个参数为 undefined', async () => {
    await program.parseAsync(['node', 'solo', 'usage', 'myagent']);
    expect(mockRunUsage.mock.calls[0][0]).toBe('myagent');
    expect(mockRunUsage.mock.calls[0][1]).toBeUndefined();
  });

  it('hook：snake_case 选项映射为 camelCase 回调参数', async () => {
    await program.parseAsync([
      'node',
      'solo',
      'hook',
      '--name',
      'alert-bell',
      '--session_name',
      'sess-1',
      '--window_name',
      'win-1',
      '--pane_index',
      '2'
    ]);
    expect(mockRunHook).toHaveBeenCalledWith({
      name: 'alert-bell',
      sessionName: 'sess-1',
      windowName: 'win-1',
      paneIndex: '2'
    });
  });

  it('start：多余参数报错，不执行 runStart（allowExcessArguments=false 生效）', async () => {
    await expect(program.parseAsync(['node', 'solo', 'start', 'extra'])).rejects.toThrow(/too many arguments/);
    expect(mockRunStart).not.toHaveBeenCalled();
  });
});
