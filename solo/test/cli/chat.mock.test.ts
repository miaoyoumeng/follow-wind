import { describe, it, expect, vi, beforeEach } from 'vitest';

import { runChat } from '../../src/cli';

const {
  mockValidateWorkspace,
  mockGetAgent,
  mockListPanesWithTitle,
  mockReadPidFile,
  mockIsProcessAlive,
  mockIpcRegisterTask,
  mockIpcDispatch
} = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockGetAgent: vi.fn(),
  mockListPanesWithTitle: vi.fn(),
  mockReadPidFile: vi.fn(),
  mockIsProcessAlive: vi.fn(),
  mockIpcRegisterTask: vi.fn(),
  mockIpcDispatch: vi.fn()
}));

vi.mock('../../src/cli/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

vi.mock('../../src/agents', () => ({
  getAgent: mockGetAgent
}));

vi.mock('../../src/tmux', () => ({
  listPanesWithTitle: mockListPanesWithTitle
}));

vi.mock('../../src/bootstrap', () => ({
  readPidFile: mockReadPidFile,
  isProcessAlive: mockIsProcessAlive
}));

vi.mock('../../src/ipc', () => ({
  ipcRegisterTask: mockIpcRegisterTask,
  ipcDispatch: mockIpcDispatch
}));

vi.mock('../../src/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn()
  }
}));

describe('runChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateWorkspace.mockReturnValue('test-session');
    mockReadPidFile.mockReturnValue(12345);
    mockIsProcessAlive.mockReturnValue(true);
    mockIpcRegisterTask.mockResolvedValue('task-ipc-001');
    mockIpcDispatch.mockResolvedValue(true);
  });

  describe('agent 不存在', () => {
    it('getAgent 返回 undefined 时，打印友好提示并返回', async () => {
      mockGetAgent.mockReturnValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('nonexistent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('agent "nonexistent" 不存在'));
      expect(mockIpcRegisterTask).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('agent 无 claude pane', () => {
    it('agent 未配置 panes 时，打印友好提示并返回', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: false,
        panes: undefined
      });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('agent "myagent" 没有 claude pane'));
      expect(mockIpcRegisterTask).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('agent 的 panes 中无 claude tag 时，打印友好提示并返回', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: false,
        panes: {
          left: { layout: 'left' },
          right: { layout: 'right' }
        }
      });
      mockListPanesWithTitle.mockResolvedValue([
        { index: 0, title: 'left' },
        { index: 1, title: 'right' }
      ]);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('agent "myagent" 没有 claude pane'));
      expect(mockIpcRegisterTask).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('正常流程', () => {
    it('找到 claude pane 后，通过 IPC 注册任务并分发指令；dispatched=true 时打印成功提示', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: false,
        panes: {
          left: { layout: 'left' },
          claude: { layout: 'right' }
        }
      });
      mockListPanesWithTitle.mockResolvedValue([
        { index: 0, title: 'left' },
        { index: 1, title: 'claude' }
      ]);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello world');

      expect(mockValidateWorkspace).toHaveBeenCalled();
      expect(mockGetAgent).toHaveBeenCalledWith('myagent');
      expect(mockListPanesWithTitle).toHaveBeenCalledWith('test-session', 'myagent');
      expect(mockIpcRegisterTask).toHaveBeenCalledWith({
        type: 'claude',
        agentName: 'myagent',
        session: 'test-session',
        window: 'myagent',
        paneIndex: 1
      });
      expect(mockIpcDispatch).toHaveBeenCalledWith('test-session', 'myagent', 1, 'hello world');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('chat 任务提交成功'));

      consoleSpy.mockRestore();
    });

    it('dispatched=false 时，打印失败提示，不打印成功提示', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: true,
        panes: { claude: { layout: 'left' } }
      });
      mockListPanesWithTitle.mockResolvedValue([{ index: 0, title: 'claude' }]);
      mockIpcDispatch.mockResolvedValue(false);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('chat 任务提交成功'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('尚未注册 router'));

      consoleSpy.mockRestore();
    });
  });

  describe('daemon 未启动', () => {
    it('PID 文件不存在时，显示未启动提示，不执行后续操作', async () => {
      mockReadPidFile.mockReturnValue(null);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('solo 未启动'));
      expect(mockIpcRegisterTask).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('PID 对应进程不存在时，显示未启动提示', async () => {
      mockReadPidFile.mockReturnValue(99999);
      mockIsProcessAlive.mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('solo 未启动'));
      expect(mockIpcRegisterTask).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('IPC 注册任务', () => {
    it('daemon 存活时，通过 IPC 注册完整 chat 任务（含 pane 信息）并通过 ipcDispatch 分发指令', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: true,
        panes: { claude: { layout: 'left' } }
      });
      mockListPanesWithTitle.mockResolvedValue([{ index: 0, title: 'claude' }]);

      await runChat('myagent', 'hello');

      expect(mockIpcRegisterTask).toHaveBeenCalledWith({
        type: 'claude',
        agentName: 'myagent',
        session: 'test-session',
        window: 'myagent',
        paneIndex: 0
      });
      expect(mockIpcDispatch).toHaveBeenCalledWith('test-session', 'myagent', 0, 'hello');
    });

    it('IPC 注册失败时，显示连接异常提示', async () => {
      mockGetAgent.mockReturnValue({
        name: 'myagent',
        workspace: '/tmp',
        activate: true,
        panes: { claude: { layout: 'left' } }
      });
      mockListPanesWithTitle.mockResolvedValue([{ index: 0, title: 'claude' }]);
      mockIpcRegisterTask.mockRejectedValue(new Error('connection refused'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await runChat('myagent', 'hello');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('IPC'));

      consoleSpy.mockRestore();
    });
  });
});
