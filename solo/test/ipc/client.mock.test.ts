import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { IpcRequest } from '../../src/ipc/types';

const { mockRegisterTask, mockListTasks, mockUpdateTaskState, mockGetTerminalCounts, mockGetTask, mockDispatch } =
  vi.hoisted(() => ({
    mockRegisterTask: vi.fn().mockReturnValue('task-001'),
    mockListTasks: vi.fn().mockReturnValue([]),
    mockUpdateTaskState: vi.fn(),
    mockGetTerminalCounts: vi.fn().mockReturnValue({ completed: 0, timeout: 0, failed: 0, killed: 0 }),
    mockGetTask: vi.fn().mockReturnValue({ id: 'task-001', type: 'tmux', status: 'running', createdAt: '' }),
    mockDispatch: vi.fn().mockResolvedValue(true)
  }));

vi.mock('../../src/task/chatTaskStorage', () => ({
  registerTask: mockRegisterTask,
  listTasks: mockListTasks,
  updateTaskState: mockUpdateTaskState,
  getTerminalCounts: mockGetTerminalCounts,
  getTask: mockGetTask
}));

vi.mock('../../src/pipe/dispatcher', () => ({
  dispatch: mockDispatch
}));

vi.mock('../../src/logging', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

vi.mock('../../src/task/loop', () => ({
  pollingWithTimeout: vi.fn()
}));

import { ipcRegisterTask, ipcListTasks, exitDaemon, ipcDispatch } from '../../src/ipc/client';
import { handleMessage } from '../../src/ipc/server';

describe('ipc/client（集成测试：真实 socket）', () => {
  let server: net.Server;
  let socketPath: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDispatch.mockResolvedValue(true);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipc-test-'));
    socketPath = path.join(tmpDir, 'test.sock');
    await new Promise<void>(resolve => {
      server = net.createServer({ allowHalfOpen: true }, conn => {
        let buf = '';
        conn.on('data', (chunk: Buffer) => {
          buf += chunk.toString();
        });
        conn.on('end', () => {
          const req = JSON.parse(buf) as IpcRequest;
          const result = handleMessage(req);
          const send = (res: unknown): void => {
            try {
              conn.end(JSON.stringify(res));
            } catch {
              // connection already closed
            }
          };
          if (result instanceof Promise) {
            void result.then(res => {
              setImmediate(() => send(res));
            });
          } else {
            send(result);
          }
        });
      });
      server.listen(socketPath, () => resolve());
    });
  });

  afterEach(() => {
    server.close();
  });

  it('ipcRegisterTask 通过 IPC 注册任务，返回 taskId', async () => {
    const result = await ipcRegisterTask({ type: 'tmux' }, socketPath);
    expect(result).toBe('task-001');
    expect(mockRegisterTask).toHaveBeenCalledWith({ type: 'tmux' });
  });

  it('ipcRegisterTask 支持传入完整 pane 信息', async () => {
    const result = await ipcRegisterTask(
      { type: 'claude', agentName: 'agent1', session: 'sess', window: 'win', paneIndex: 2 },
      socketPath
    );
    expect(result).toBe('task-001');
    expect(mockRegisterTask).toHaveBeenCalledWith({
      type: 'claude',
      agentName: 'agent1',
      session: 'sess',
      window: 'win',
      paneIndex: 2
    });
  });

  it('ipcDispatch 通过 IPC 分发指令，返回 dispatched=true', async () => {
    mockDispatch.mockResolvedValueOnce(true);
    const result = await ipcDispatch('test-session', 'myagent', 0, 'hello world', socketPath);
    expect(result).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith('test-session', 'myagent', 0, { command: 'hello world' });
  });

  it('ipcDispatch 在 dispatch 抛异常时抛出错误而非挂起', async () => {
    mockDispatch.mockRejectedValueOnce(new Error('dispatch failed'));
    await expect(ipcDispatch('test-session', 'myagent', 0, 'hello', socketPath)).rejects.toThrow('dispatch failed');
  });

  it('ipcListTasks 通过 IPC 获取全部任务列表和终态计数', async () => {
    const tasks = [{ id: 'task-1', status: 'running' as const, type: 'tmux' as const, createdAt: '' }];
    mockListTasks.mockReturnValue(tasks);
    mockGetTerminalCounts.mockReturnValue({ completed: 2, timeout: 0, failed: 0, killed: 0 });
    const result = await ipcListTasks(socketPath);
    expect(result).toEqual({
      tasks,
      terminalCounts: { completed: 2, timeout: 0, failed: 0, killed: 0 }
    });
  });
});

describe('exitDaemon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('daemon 未运行时（socket 文件不存在）抛出连接错误', async () => {
    await expect(exitDaemon('/tmp/nonexistent-default.sock')).rejects.toThrow();
  });

  it('daemon 未运行时（socket 文件不存在）使用自定义路径也抛出错误', async () => {
    await expect(exitDaemon('/tmp/nonexistent-ipc.sock')).rejects.toThrow();
  });
});
