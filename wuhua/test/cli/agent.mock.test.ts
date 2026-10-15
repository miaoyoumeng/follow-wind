import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

const { mockValidateWorkspace, mockGetAgents, mockGetAgent, mockListPanes, mockSendKeys } = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockGetAgents: vi.fn(),
  mockGetAgent: vi.fn(),
  mockListPanes: vi.fn(),
  mockSendKeys: vi.fn()
}));

// status 是工作区校验依赖，mock 以隔离 runAgent 的编排逻辑
vi.mock('../../src/cli/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

// agents 是配置解析依赖，mock 以隔离 agent 查找逻辑
vi.mock('../../src/agents', () => ({
  getAgents: mockGetAgents,
  getAgent: mockGetAgent
}));

// tmux 是外部命令依赖，mock 以隔离真实的 tmux 操作
vi.mock('../../src/tmux', () => ({
  listPanes: mockListPanes,
  sendKeys: mockSendKeys
}));

// logging 是日志输出依赖，mock 以避免测试过程写日志
vi.mock('../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown
}));

import { runAgent } from '../../src/cli/agent';
import type { Agent } from '../../src/agents';

const CONSOLE_AGENT: Agent = { name: 'console', workspace: '/ws/console', activate: true };
const BACKEND_AGENT: Agent = { name: 'backend', workspace: '/ws/backend', activate: true };

describe('runAgent', () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateWorkspace.mockReturnValue('my-session');
    mockGetAgent.mockReturnValue(undefined);
    mockGetAgents.mockReturnValue([]);
    mockListPanes.mockResolvedValue([0, 1, 2]);
    mockSendKeys.mockResolvedValue(undefined);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.exitCode = undefined;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.exitCode = undefined;
  });

  it('先校验工作区', async () => {
    mockGetAgent.mockReturnValue(CONSOLE_AGENT);

    await runAgent('console', 1, 'git pull');

    expect(mockValidateWorkspace).toHaveBeenCalledTimes(1);
  });

  it('把命令提交到指定 agent 的指定 pane', async () => {
    mockGetAgent.mockReturnValue(CONSOLE_AGENT);

    await runAgent('console', 2, 'git pull');

    expect(mockSendKeys).toHaveBeenCalledWith('my-session', 'console', 2, 'git pull');
  });

  it('省略 pane-index 时提交到 pane 1', async () => {
    mockGetAgent.mockReturnValue(CONSOLE_AGENT);

    await runAgent('console', undefined, 'git pull');

    expect(mockSendKeys).toHaveBeenCalledWith('my-session', 'console', 1, 'git pull');
  });

  it('--name=all 时提交到全部 activate 的 agent，跳过未 activate 的', async () => {
    mockGetAgents.mockReturnValue([CONSOLE_AGENT, BACKEND_AGENT, { ...CONSOLE_AGENT, name: 'off', activate: false }]);

    await runAgent('all', 1, 'git pull');

    expect(mockSendKeys.mock.calls).toEqual([
      ['my-session', 'console', 1, 'git pull'],
      ['my-session', 'backend', 1, 'git pull']
    ]);
  });

  it('agent 不存在时在终端提示、设置退出码 1，且不提交', async () => {
    await runAgent('nope', 1, 'git pull');

    expect(mockSendKeys).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(consoleSpy.mock.calls.flat().join(' ')).toContain('agent "nope" 不存在');
  });

  it('目标 pane 不存在时不提交，并提示可用 pane', async () => {
    mockGetAgent.mockReturnValue(CONSOLE_AGENT);
    mockListPanes.mockResolvedValue([0]);

    await runAgent('console', 1, 'git pull');

    expect(mockSendKeys).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(consoleSpy.mock.calls.flat().join(' ')).toContain('可用 pane: 0');
  });

  it('window 不可用时计为失败，且继续提交后续 agent', async () => {
    mockGetAgents.mockReturnValue([CONSOLE_AGENT, BACKEND_AGENT]);
    mockListPanes.mockRejectedValueOnce(new Error("can't find window")).mockResolvedValueOnce([0, 1]);

    await runAgent('all', 1, 'git pull');

    expect(mockSendKeys).toHaveBeenCalledTimes(1);
    expect(mockSendKeys).toHaveBeenCalledWith('my-session', 'backend', 1, 'git pull');
    expect(process.exitCode).toBe(1);
  });

  it('全部提交成功时不改变退出码', async () => {
    mockGetAgents.mockReturnValue([CONSOLE_AGENT, BACKEND_AGENT]);

    await runAgent('all', 1, 'git pull');

    expect(process.exitCode).toBeUndefined();
  });

  it('--name=all 且没有 activate 的 agent 时不提交，也不视为失败', async () => {
    mockGetAgents.mockReturnValue([{ ...CONSOLE_AGENT, activate: false }]);

    await runAgent('all', 1, 'git pull');

    expect(mockSendKeys).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it('命令为空白时不提交，并设置退出码 1', async () => {
    mockGetAgent.mockReturnValue(CONSOLE_AGENT);

    await runAgent('console', 1, '   ');

    expect(mockSendKeys).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('pane-index 不是非负整数时不提交，并设置退出码 1', async () => {
    mockGetAgent.mockReturnValue(CONSOLE_AGENT);

    await runAgent('console', Number.NaN, 'git pull');

    expect(mockSendKeys).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
