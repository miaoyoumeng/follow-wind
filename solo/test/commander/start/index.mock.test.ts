import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readConfig, type SoloConfig } from '../../../src/core/yaml';
import { runStart } from '../../../src/commander/start';
import {
  sessionExists,
  createSession,
  createWindow,
  attachSession,
  listWindows,
  listPanes,
  splitPane,
  setPaneTitle
} from '../../../src/tmux';

// 文件 IO 与外部 tmux 命令均属外部依赖，mock 以隔离 start 调度逻辑
vi.mock('../../../src/core/yaml', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  isValidPanePosition: (v: unknown) =>
    typeof v === 'string' && ['left', 'right', 'left-top', 'right-top', 'left-bottom', 'right-bottom'].includes(v)
}));

vi.mock('../../../src/core/checker', () => ({
  checkSettings: vi.fn(() => ({ exists: true, path: '.solo/config' })),
  checkClaude: vi.fn(),
  checkTmux: vi.fn()
}));

vi.mock('../../../src/tmux', () => ({
  sessionExists: vi.fn(),
  createSession: vi.fn(),
  createWindow: vi.fn(),
  attachSession: vi.fn(),
  listWindows: vi.fn(),
  listPanes: vi.fn(),
  splitPane: vi.fn(),
  setPaneTitle: vi.fn()
}));

// claude 启动是外部副作用，mock 以隔离 start 调度逻辑
vi.mock('../../../src/claude', () => ({
  startClaude: vi.fn().mockResolvedValue(undefined)
}));

const mockReadConfig = vi.mocked(readConfig);
const mockSessionExists = vi.mocked(sessionExists);
const mockCreateSession = vi.mocked(createSession);
const mockCreateWindow = vi.mocked(createWindow);
const mockAttachSession = vi.mocked(attachSession);
const mockListWindows = vi.mocked(listWindows);
const mockListPanes = vi.mocked(listPanes);
const mockSplitPane = vi.mocked(splitPane);
const mockSetPaneTitle = vi.mocked(setPaneTitle);

const sampleConfig: SoloConfig = {
  name: 'sess-abc',
  agents: {
    'act-h': {
      workspace: '/a',
      activate: true,
      panes: { left: 'claude', right: 'shell' }
    },
    'act-no-panes': {
      workspace: '/b',
      activate: true
    },
    'act-false': {
      workspace: '/c',
      activate: false,
      panes: { left: 'claude', right: 'shell' }
    },
    'legacy-no-field': {
      workspace: '/d'
    }
  }
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
  let spy: ReturnType<typeof vi.spyOn>;

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
    expect(mockSplitPane).toHaveBeenCalledWith('sess-abc:act-h.1', '-h', '/a');
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

  it('session 已存在时直接附加，不重复创建与分屏', async () => {
    mockSessionExists.mockResolvedValue(true);
    await runStart();
    expect(mockAttachSession).toHaveBeenCalledWith('sess-abc');
    expect(mockCreateWindow).not.toHaveBeenCalled();
    expect(mockSplitPane).not.toHaveBeenCalled();
  });
});
