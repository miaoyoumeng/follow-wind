import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { readConfig, type SoloConfig } from '../../src/config';
import { runStart } from '../../src/commander';
import type * as LoggingType from '../../src/logging';
import {
  sessionExists,
  createSession,
  createWindow,
  attachSession,
  listWindows,
  listPanes,
  splitPane,
  setPaneTitle,
  registerHooks
} from '../../src/tmux';

// 文件 IO 与外部 tmux 命令均属外部依赖，mock 以隔离 start 调度逻辑
vi.mock('../../src/config', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  isValidPanePosition: (v: unknown) =>
    typeof v === 'string' && ['left', 'right', 'left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(v)
}));

vi.mock('../../src/envs', () => ({
  checkSettings: vi.fn(() => ({ exists: true, path: '.solo/config' })),
  checkClaude: vi.fn(),
  checkTmux: vi.fn()
}));

const {
  mockLoggerInfo,
  mockDebug,
  mockRegisterTask,
  mockStartWorker,
  mockWritePidFile,
  mockReadPidFile,
  mockIsProcessAlive,
  mockStartDaemon,
  mockStopDaemon,
  mockValidateWorkspace
} = vi.hoisted(() => ({
  mockLoggerInfo: vi.fn(),
  mockDebug: vi.fn(),
  mockRegisterTask: vi.fn().mockReturnValue('task-001'),
  mockStartWorker: vi.fn().mockReturnValue(12345),
  mockWritePidFile: vi.fn(),
  mockReadPidFile: vi.fn().mockReturnValue(null),
  mockIsProcessAlive: vi.fn().mockReturnValue(false),
  mockStartDaemon: vi.fn().mockReturnValue(vi.fn()),
  mockStopDaemon: vi.fn(),
  mockValidateWorkspace: vi.fn().mockReturnValue('sess-abc')
}));

vi.mock('../../src/logging', async importOriginal => {
  const actual = await importOriginal<typeof LoggingType>();
  return {
    ...actual,
    logger: { trace: vi.fn(), debug: mockDebug, info: mockLoggerInfo, warn: vi.fn(), error: vi.fn() } as unknown,
    info: mockLoggerInfo,
    debug: mockDebug
  };
});

vi.mock('../../src/tmux', () => ({
  sessionExists: vi.fn(),
  createSession: vi.fn(),
  createWindow: vi.fn(),
  attachSession: vi.fn(),
  listWindows: vi.fn(),
  listPanes: vi.fn(),
  splitPane: vi.fn(),
  setPaneTitle: vi.fn(),
  // hooks 注册行为已由 test/tmux/hooks.mock.test.ts 覆盖，此处 mock 以验证 start 的调度时机
  registerHooks: vi.fn().mockResolvedValue([])
}));

// task 管理与 worker 启动属外部依赖，mock 以隔离 start 的任务调度逻辑
vi.mock('../../src/task/taskStorage', () => ({
  registerTask: mockRegisterTask
}));

vi.mock('../../src/process/wait', () => ({
  startWorker: mockStartWorker
}));

vi.mock('../../src/commander/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

vi.mock('../../src/process/pid', () => ({
  writePidFile: mockWritePidFile,
  readPidFile: mockReadPidFile,
  isProcessAlive: mockIsProcessAlive
}));

vi.mock('../../src/process/daemon', () => ({
  startDaemon: mockStartDaemon,
  stopDaemon: mockStopDaemon
}));

const mockReadConfig = vi.mocked(readConfig);
const mockRegisterHooks = vi.mocked(registerHooks);
const mockSessionExists = vi.mocked(sessionExists);
const mockCreateSession = vi.mocked(createSession);
const mockCreateWindow = vi.mocked(createWindow);
const mockAttachSession = vi.mocked(attachSession);
const mockListWindows = vi.mocked(listWindows);
const mockListPanes = vi.mocked(listPanes);
const mockSplitPane = vi.mocked(splitPane);
const mockSetPaneTitle = vi.mocked(setPaneTitle);
const mockRegisterTaskFn = vi.mocked(mockRegisterTask);
const mockStartWorkerFn = vi.mocked(mockStartWorker);
const mockWritePidFileFn = vi.mocked(mockWritePidFile);
const mockReadPidFileFn = vi.mocked(mockReadPidFile);
const mockIsProcessAliveFn = vi.mocked(mockIsProcessAlive);
const mockStartDaemonFn = vi.mocked(mockStartDaemon);

const sampleConfig: SoloConfig = {
  name: 'sess-abc',
  agents: {
    'act-h': {
      workspace: '/a',
      activate: true,
      panes: { claude: { layout: 'left' }, shell: { layout: 'right' } }
    },
    'act-no-panes': {
      workspace: '/b',
      activate: true
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
    'alert-activity': true,
    'after-send-keys': true,
    'alert-bell': false
  },
  logging: { level: 'info', file: '/tmp/solo.log' }
};

function setup(): void {
  vi.clearAllMocks();
  mockReadConfig.mockReturnValue(sampleConfig);
  mockSessionExists.mockResolvedValue(false); // session 不存在 → 走创建分支
  mockCreateSession.mockResolvedValue();
  mockCreateWindow.mockResolvedValue();
  mockAttachSession.mockResolvedValue();
  // runStart 先 createWindow，之后 applyAgentLayout 查 listWindows 需返回已创建的 window，避免重复创建
  mockListWindows.mockImplementation(async (_sessionName: string) => [
    { name: 'act-h', panes: 1 },
    { name: 'act-no-panes', panes: 1 }
  ]);
  mockListPanes.mockResolvedValue([1, 2]);
  mockSplitPane.mockResolvedValue(2);
  mockSetPaneTitle.mockResolvedValue();
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

  it('只对 activate: true 的 agent 创建 window', async () => {
    await runStart();
    expect(mockCreateSession).toHaveBeenCalledWith('sess-abc', expect.any(String));
    expect(mockCreateWindow).toHaveBeenCalledTimes(2);
    expect(mockCreateWindow).toHaveBeenCalledWith('sess-abc', 'act-h', '/a');
    expect(mockCreateWindow).toHaveBeenCalledWith('sess-abc', 'act-no-panes', '/b');
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
    expect(mockCreateSession).toHaveBeenCalled();
    expect(mockCreateWindow).not.toHaveBeenCalled();
  });

  it('session 已存在时不重复创建与分屏，不阻塞 attach', async () => {
    mockSessionExists.mockResolvedValue(true);
    await runStart();
    expect(mockAttachSession).not.toHaveBeenCalled();
    expect(mockCreateWindow).not.toHaveBeenCalled();
    expect(mockSplitPane).not.toHaveBeenCalled();
  });

  it('session 不存在时：窗口与布局就绪后注册配置的 hooks', async () => {
    mockRegisterHooks.mockResolvedValueOnce(['alert-activity', 'after-send-keys']);
    await runStart();
    expect(mockRegisterHooks).toHaveBeenCalledWith('sess-abc', sampleConfig.hooks);
    const infoMessages = mockLoggerInfo.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(infoMessages.some(m => m.includes('hooks 已注册') && m.includes('alert-activity, after-send-keys'))).toBe(
      true
    );
  });

  it('session 已存在时：先注册 hooks 再启动 daemon', async () => {
    mockSessionExists.mockResolvedValue(true);
    await runStart();
    expect(mockRegisterHooks).toHaveBeenCalledWith('sess-abc', sampleConfig.hooks);
    const registerOrder = mockRegisterHooks.mock.invocationCallOrder[0];
    const daemonOrder = mockStartDaemon.mock.invocationCallOrder[0];
    expect(registerOrder).toBeLessThan(daemonOrder);
  });

  it('hooks 注册抛错时终止 start，不进入 session', async () => {
    mockSessionExists.mockResolvedValue(true);
    mockRegisterHooks.mockRejectedValueOnce(new Error('hooks 配置包含未知事件 "pane-created"'));
    await expect(runStart()).rejects.toThrow(/hooks 配置包含未知事件/);
    expect(mockAttachSession).not.toHaveBeenCalled();
  });

  it('控制台输出 solo starting...、solo name [name]、solo started 三条消息', async () => {
    await runStart();
    expect(logs).toHaveLength(3);
    expect(logs[0]).toContain('solo starting...');
    expect(logs[1]).toContain('solo name');
    expect(logs[1]).toContain('sess-abc');
    expect(logs[2]).toContain(`solo started, pid is ${process.pid}`);
  });

  it('为每个 active agent 的每个 pane 注册 task 并启动 worker', async () => {
    await runStart();
    // 2 个 active agent × 2 个 pane（mockListPanes 返回 [1, 2]）= 4 个 task
    expect(mockRegisterTaskFn).toHaveBeenCalledTimes(4);
    expect(mockStartWorkerFn).toHaveBeenCalledTimes(4);
    // 验证 registerTask 参数
    expect(mockRegisterTaskFn).toHaveBeenCalledWith({
      agentName: 'act-h',
      session: 'sess-abc',
      window: 'act-h',
      paneIndex: 1
    });
    expect(mockRegisterTaskFn).toHaveBeenCalledWith({
      agentName: 'act-no-panes',
      session: 'sess-abc',
      window: 'act-no-panes',
      paneIndex: 2
    });
    // 验证 startWorker 参数
    expect(mockStartWorkerFn).toHaveBeenCalledWith('task-001', 'sess-abc', 'act-h', 1, 'act-h');
  });

  it('session 已存在时也为 active agent 注册 task', async () => {
    mockSessionExists.mockResolvedValue(true);
    await runStart();
    // session 已存在 → 不创建 window，但仍为 active agent 枚举 pane 并注册 task
    expect(mockRegisterTaskFn).toHaveBeenCalledTimes(4);
  });

  it('启动完成后写入 PID 文件', async () => {
    await runStart();
    expect(mockWritePidFileFn).toHaveBeenCalledTimes(1);
  });

  it('启动完成后启动常住进程 daemon', async () => {
    await runStart();
    expect(mockStartDaemonFn).toHaveBeenCalledTimes(1);
  });

  describe('daemon 已运行（重复执行检测）', () => {
    it('PID 文件存在且进程存活时，显示友好提示并跳过启动', async () => {
      mockReadPidFileFn.mockReturnValue(12345);
      mockIsProcessAliveFn.mockReturnValue(true);

      await runStart();

      // 验证第二条日志包含友好提示（daemon 已运行时）
      expect(logs.length).toBeGreaterThanOrEqual(2);
      const stripAnsi = (s: string): string => s.replace(/\[[0-9;]*m/g, '');
      expect(stripAnsi(String(logs[1]))).toContain('已在运行');
      expect(mockCreateSession).not.toHaveBeenCalled();
      expect(mockStartDaemonFn).not.toHaveBeenCalled();
      expect(mockWritePidFileFn).not.toHaveBeenCalled();
    });

    it('PID 文件存在但进程已死亡时，正常启动', async () => {
      mockReadPidFileFn.mockReturnValue(99999);
      mockIsProcessAliveFn.mockReturnValue(false);

      await runStart();

      expect(mockCreateSession).toHaveBeenCalled();
      expect(mockStartDaemonFn).toHaveBeenCalled();
      expect(mockWritePidFileFn).toHaveBeenCalled();
    });

    it('PID 文件不存在时，正常启动', async () => {
      mockReadPidFileFn.mockReturnValue(null);

      await runStart();

      expect(mockCreateSession).toHaveBeenCalled();
      expect(mockStartDaemonFn).toHaveBeenCalled();
    });
  });
});
