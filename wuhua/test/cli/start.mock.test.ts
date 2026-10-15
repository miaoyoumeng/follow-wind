import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { readConfig, type WuhuaConfig, type AgentPanes } from '../../src/config';
import { runStart } from '../../src/cli';
import type * as LoggingType from '../../src/logging';
import type { TmuxRouter } from '../../src/pipe';
import {
  sessionExists,
  createSession,
  createTmuxWindow,
  listPanes,
  splitPane,
  setPaneTitle,
  sendKeys,
  registerHooks
} from '../../src/tmux';
import { registerRouter } from '../../src/task';

// 文件 IO 与外部 tmux 命令均属外部依赖，mock 以隔离 start 调度逻辑
vi.mock('../../src/config', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  isValidPanePosition: (v: unknown): boolean =>
    typeof v === 'string' && ['left', 'right', 'left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(v)
}));

vi.mock('../../src/envs', () => ({
  checkSettings: vi.fn(() => ({ exists: true, path: '.wuhua/config' })),
  checkClaude: vi.fn(),
  checkTmux: vi.fn()
}));

const {
  mockLoggerInfo,
  mockDebug,
  mockRegisterTask,
  mockWritePidFile,
  mockReadPidFile,
  mockIsProcessAlive,
  mockStartDaemon,
  mockStopDaemon,
  mockIsDaemonRunning,
  mockValidateWorkspace
} = vi.hoisted(() => ({
  mockLoggerInfo: vi.fn(),
  mockDebug: vi.fn(),
  mockRegisterTask: vi.fn().mockReturnValue('task-001'),
  mockWritePidFile: vi.fn(),
  mockReadPidFile: vi.fn().mockReturnValue(null),
  mockIsProcessAlive: vi.fn().mockReturnValue(false),
  mockStartDaemon: vi.fn().mockReturnValue(vi.fn()),
  mockStopDaemon: vi.fn(),
  mockIsDaemonRunning: vi.fn().mockReturnValue(false),
  mockValidateWorkspace: vi.fn().mockReturnValue('sess-abc')
}));

vi.mock('../../src/logging', async importOriginal => {
  const actual = await importOriginal<typeof LoggingType>();
  return {
    ...actual,
    logger: {
      trace: vi.fn(),
      debug: mockDebug,
      info: mockLoggerInfo,
      warn: vi.fn(),
      error: vi.fn()
    } as unknown,
    info: mockLoggerInfo,
    debug: mockDebug
  };
});

vi.mock('../../src/tmux', () => ({
  sessionExists: vi.fn(),
  createSession: vi.fn(),
  createTmuxWindow: vi.fn(),
  listPanes: vi.fn(),
  splitPane: vi.fn(),
  setPaneTitle: vi.fn(),
  sendKeys: vi.fn(),
  // hooks 注册行为已由 test/tmux/hooks.mock.test.ts 覆盖，此处 mock 以验证 start 的调度时机
  registerHooks: vi.fn().mockResolvedValue([])
}));

// task 管理属外部依赖，mock 以隔离 start 的任务调度逻辑
vi.mock('../../src/task/chatTaskStorage', () => ({
  registerTask: mockRegisterTask
}));

vi.mock('../../src/cli/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

vi.mock('../../src/bootstrap', () => ({
  writePidFile: mockWritePidFile,
  readPidFile: mockReadPidFile,
  isProcessAlive: mockIsProcessAlive,
  isDaemonRunning: mockIsDaemonRunning,
  startDaemon: mockStartDaemon
}));

vi.mock('../../src/task', () => ({
  registerRouter: vi.fn().mockReturnValue({} as unknown as TmuxRouter)
}));

const mockReadConfig = vi.mocked(readConfig);
const mockRegisterHooks = vi.mocked(registerHooks);
const mockSessionExists = vi.mocked(sessionExists);
const mockCreateSession = vi.mocked(createSession);
const mockCreateWindow = vi.mocked(createTmuxWindow);
const mockListPanes = vi.mocked(listPanes);
const mockSplitPane = vi.mocked(splitPane);
const mockSetPaneTitle = vi.mocked(setPaneTitle);
const mockSendKeys = vi.mocked(sendKeys);
const mockRegisterRouter = vi.mocked(registerRouter);
const mockRegisterTaskFn = vi.mocked(mockRegisterTask);
const mockWritePidFileFn = vi.mocked(mockWritePidFile);
const mockReadPidFileFn = vi.mocked(mockReadPidFile);
const mockIsProcessAliveFn = vi.mocked(mockIsProcessAlive);
const mockStartDaemonFn = vi.mocked(mockStartDaemon);

const sampleConfig: WuhuaConfig = {
  name: 'sess-abc',
  agents: {
    'act-h': {
      workspace: '/a',
      activate: true,
      panes: { claude: { layout: 'left' }, shell: { layout: 'right' } }
    },
    'act-no-panes': {
      workspace: '/b',
      activate: false
    },
    'act-false': {
      workspace: '/c',
      activate: false,
      panes: { claude: { layout: 'left' }, shell: { layout: 'right' } }
    },
    'legacy-no-field': {
      workspace: '/d'
    }
  },
  hooks: {
    tmux: {
      'alert-activity': true,
      'after-send-keys': true,
      'alert-bell': false
    }
  },
  logging: { level: 'info', file: '/tmp/wuhua.log' }
};

function setup(): void {
  vi.clearAllMocks();
  mockReadConfig.mockReturnValue(sampleConfig);
  mockSessionExists.mockResolvedValue(false); // session 不存在 → 走创建分支
  mockCreateSession.mockResolvedValue();
  mockCreateWindow.mockResolvedValue();
  mockListPanes.mockResolvedValue([1, 2]);
  mockSplitPane.mockResolvedValue(2);
  mockSetPaneTitle.mockResolvedValue();
  mockSendKeys.mockResolvedValue();
}

describe('runStart', () => {
  let logs: string[];
  let spy: MockInstance;

  beforeEach(() => {
    setup();
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('只有一个 activate agent 时，window 数量为 1（复用 session 默认 window，不额外新建）', async () => {
    await runStart();
    expect(mockCreateSession).toHaveBeenCalledWith('sess-abc', 'act-h', '/a');
    expect(mockCreateWindow).not.toHaveBeenCalled();
  });

  it('多个 activate agent 时，window 数量与 agent 数量一致（首个复用默认 window，其余新建）', async () => {
    mockReadConfig.mockReturnValue({
      ...sampleConfig,
      agents: {
        'act-h': {
          workspace: '/a',
          activate: true,
          panes: { claude: { layout: 'left' }, shell: { layout: 'right' } }
        },
        'act-two': {
          workspace: '/b',
          activate: true,
          panes: { main: { layout: 'one' } } as unknown as AgentPanes
        }
      }
    });
    await runStart();
    expect(mockCreateSession).toHaveBeenCalledWith('sess-abc', 'act-h', '/a');
    expect(mockCreateWindow).toHaveBeenCalledTimes(1);
    expect(mockCreateWindow).toHaveBeenCalledWith('sess-abc', 'act-two', '/b');
  });

  it('activate: true 且配置 panes 的 agent 执行分屏', async () => {
    await runStart();
    // act-h 有 panes: { left, right } → 执行 -h split
    expect(mockSplitPane).toHaveBeenCalledWith('sess-abc', 'act-h', 1, '-h', '/a');
  });

  it('activate: true 但未配置 panes 的 agent 不执行分屏', async () => {
    await runStart();
    // act-no-panes 无 panes → 不 split
    // 仅 act-h 执行了 split
    expect(mockSplitPane).toHaveBeenCalledTimes(1);
  });

  it('activate: false 与未配置 activate 的 agent 完全跳过', async () => {
    await runStart();
    expect(mockCreateWindow).not.toHaveBeenCalledWith('sess-abc', 'act-false', '/c');
    expect(mockCreateWindow).not.toHaveBeenCalledWith('sess-abc', 'legacy-no-field', '/d');
  });

  it('无任何 activate agent 时只创建 session，不建 window', async () => {
    mockReadConfig.mockReturnValue({
      name: 'sess-abc',
      agents: { 'act-false': { workspace: '/c', activate: false } }
    });
    await runStart();
    expect(mockCreateSession).toHaveBeenCalledWith('sess-abc', undefined, expect.any(String));
    expect(mockCreateWindow).not.toHaveBeenCalled();
  });

  it('session 已存在时输出友好提示并终止流程', async () => {
    mockSessionExists.mockResolvedValue(true);
    await runStart();
    const friendlyMsg = logs.find(l => l.includes('已存在'));
    expect(friendlyMsg).toBeDefined();
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockCreateWindow).not.toHaveBeenCalled();
    expect(mockSplitPane).not.toHaveBeenCalled();
    expect(mockRegisterHooks).not.toHaveBeenCalled();
    expect(mockWritePidFileFn).not.toHaveBeenCalled();
    expect(mockStartDaemonFn).not.toHaveBeenCalled();
  });

  it('session 不存在时：窗口与布局就绪后注册配置的 hooks', async () => {
    mockRegisterHooks.mockResolvedValueOnce(['alert-activity', 'after-send-keys']);
    await runStart();
    expect(mockRegisterHooks).toHaveBeenCalledWith('sess-abc', sampleConfig.hooks?.tmux);
    const infoMessages = mockLoggerInfo.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(infoMessages.some(m => m.includes('hooks 已注册') && m.includes('alert-activity, after-send-keys'))).toBe(
      true
    );
  });

  it('session 已存在时不注册 hooks、不启动 daemon', async () => {
    mockSessionExists.mockResolvedValue(true);
    await runStart();
    expect(mockRegisterHooks).not.toHaveBeenCalled();
    expect(mockStartDaemonFn).not.toHaveBeenCalled();
  });

  it('hooks 注册抛错时终止 start', async () => {
    mockRegisterHooks.mockRejectedValueOnce(new Error('hooks 配置包含未知事件 "pane-created"'));
    await expect(runStart()).rejects.toThrow(/hooks 配置包含未知事件/);
  });

  it('控制台输出 wuhua starting...、wuhua name [name]、wuhua started 三条消息', async () => {
    await runStart();
    expect(logs).toHaveLength(3);
    expect(logs[0]).toContain('wuhua starting...');
    expect(logs[1]).toContain('wuhua name');
    expect(logs[1]).toContain('sess-abc');
    expect(logs[2]).toContain(`wuhua started, pid is ${process.pid}`);
  });

  it('session 不存在时，panes 布局不合法应终止启动流程', async () => {
    mockReadConfig.mockReturnValue({
      ...sampleConfig,
      agents: {
        'act-bad': {
          workspace: '/a',
          activate: true,
          panes: { only: { layout: 'left' } }
        }
      }
    });
    await runStart();
    const errorLogs = logs.filter(l => l.includes('panes 布局配置无效'));
    expect(errorLogs.length).toBeGreaterThan(0);
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockCreateWindow).not.toHaveBeenCalled();
    expect(mockRegisterHooks).not.toHaveBeenCalled();
    expect(mockWritePidFileFn).not.toHaveBeenCalled();
    expect(mockStartDaemonFn).not.toHaveBeenCalled();
  });

  it('panes 为空对象时应终止启动流程', async () => {
    mockReadConfig.mockReturnValue({
      ...sampleConfig,
      agents: {
        'act-empty': {
          workspace: '/a',
          activate: true,
          panes: {}
        }
      }
    });
    await runStart();
    const errorLogs = logs.filter(l => l.includes('panes 布局配置无效'));
    expect(errorLogs.length).toBeGreaterThan(0);
    expect(mockCreateWindow).not.toHaveBeenCalled();
  });

  it('start 阶段不注册 task，轮询由 wuhua chat 触发', async () => {
    await runStart();
    // task 注册代码已注释，start 阶段不调用 registerTask
    expect(mockRegisterTaskFn).not.toHaveBeenCalled();
  });

  it('session 已存在时不注册 task', async () => {
    mockSessionExists.mockResolvedValue(true);
    await runStart();
    expect(mockRegisterTaskFn).not.toHaveBeenCalled();
  });

  it('启动完成后写入 PID 文件', async () => {
    await runStart();
    expect(mockWritePidFileFn).toHaveBeenCalledTimes(1);
  });

  it('启动完成后启动常住进程 daemon', async () => {
    await runStart();
    expect(mockStartDaemonFn).toHaveBeenCalledTimes(1);
  });

  describe('applyAgentLayout 内联布局', () => {
    it('layout=one 时不执行 split', async () => {
      mockReadConfig.mockReturnValue({
        ...sampleConfig,
        agents: {
          'act-one': {
            workspace: '/a',
            activate: true,
            panes: { main: { layout: 'one' } } as unknown as AgentPanes
          }
        }
      });
      await runStart();
      expect(mockSplitPane).not.toHaveBeenCalled();
    });

    it('layout=top 时执行 -v split', async () => {
      mockReadConfig.mockReturnValue({
        ...sampleConfig,
        agents: {
          'act-top': {
            workspace: '/a',
            activate: true,
            panes: { header: { layout: 'top' }, footer: { layout: 'bottom' } }
          }
        }
      });
      await runStart();
      expect(mockSplitPane).toHaveBeenCalledWith('sess-abc', 'act-top', 1, '-v', '/a');
    });

    it('layout=left 三 pane 时执行两次 split（-h + -v）', async () => {
      mockReadConfig.mockReturnValue({
        ...sampleConfig,
        agents: {
          'act-lt': {
            workspace: '/a',
            activate: true,
            panes: {
              main: { layout: 'left' },
              topRight: { layout: 'right-top' },
              bottomRight: { layout: 'right-bottom' }
            }
          }
        }
      });
      mockSplitPane.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
      await runStart();
      expect(mockSplitPane).toHaveBeenCalledTimes(2);
      expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess-abc', 'act-lt', 1, '-h', '/a');
      expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess-abc', 'act-lt', 2, '-v', '/a');
    });

    it('layout=right 三 pane 时执行两次 split（-h + -v）', async () => {
      mockReadConfig.mockReturnValue({
        ...sampleConfig,
        agents: {
          'act-rt': {
            workspace: '/a',
            activate: true,
            panes: {
              side: { layout: 'right' },
              topLeft: { layout: 'left-top' },
              bottomLeft: { layout: 'left-bottom' }
            }
          }
        }
      });
      mockSplitPane.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
      await runStart();
      expect(mockSplitPane).toHaveBeenCalledTimes(2);
      expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess-abc', 'act-rt', 1, '-h', '/a');
      expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess-abc', 'act-rt', 1, '-v', '/a');
    });

    it('每个 pane 设置标题（tag 名）', async () => {
      await runStart();
      expect(mockSetPaneTitle).toHaveBeenCalledTimes(2);
      expect(mockSetPaneTitle).toHaveBeenCalledWith('sess-abc', 'act-h', 1, 'claude');
      expect(mockSetPaneTitle).toHaveBeenCalledWith('sess-abc', 'act-h', 2, 'shell');
    });

    it('booter 有值时执行一次 sendKeys，Enter 由 sendKeys 内部追加', async () => {
      mockReadConfig.mockReturnValue({
        ...sampleConfig,
        agents: {
          'act-boot': {
            workspace: '/a',
            activate: true,
            panes: { claude: { layout: 'left', booter: 'vim' }, shell: { layout: 'right' } }
          }
        }
      });
      await runStart();
      expect(mockSendKeys).toHaveBeenCalledTimes(1);
      expect(mockSendKeys).toHaveBeenCalledWith('sess-abc', 'act-boot', 1, 'vim');
    });

    it('为每个 pane 注册 pipe router', async () => {
      await runStart();
      expect(mockRegisterRouter).toHaveBeenCalledTimes(2);
      expect(mockRegisterRouter).toHaveBeenCalledWith('sess-abc', 'act-h', 1);
      expect(mockRegisterRouter).toHaveBeenCalledWith('sess-abc', 'act-h', 2);
    });

    it('layout=one 时注册一个 pipe router', async () => {
      mockReadConfig.mockReturnValue({
        ...sampleConfig,
        agents: {
          'act-one': {
            workspace: '/a',
            activate: true,
            panes: { main: { layout: 'one' } } as unknown as AgentPanes
          }
        }
      });
      await runStart();
      expect(mockRegisterRouter).toHaveBeenCalledTimes(1);
      expect(mockRegisterRouter).toHaveBeenCalledWith('sess-abc', 'act-one', 1);
    });
  });

  describe('daemon 已运行（重复执行检测）', () => {
    it('daemon 已运行时，显示友好提示并跳过启动', async () => {
      mockIsDaemonRunning.mockReturnValue(true);

      await runStart();

      // 验证第二条日志包含友好提示（daemon 已运行时）
      expect(logs.length).toBeGreaterThanOrEqual(2);
      const stripAnsi = (s: string): string => s.replace(/\[[0-9;]*m/g, '');
      expect(stripAnsi(String(logs[1]))).toContain('已在运行');
      expect(mockCreateSession).not.toHaveBeenCalled();
      expect(mockStartDaemonFn).not.toHaveBeenCalled();
      expect(mockWritePidFileFn).not.toHaveBeenCalled();
    });

    it('daemon 未运行时，正常启动', async () => {
      mockIsDaemonRunning.mockReturnValue(false);

      await runStart();

      expect(mockCreateSession).toHaveBeenCalled();
      expect(mockStartDaemonFn).toHaveBeenCalled();
      expect(mockWritePidFileFn).toHaveBeenCalled();
    });
  });
});
