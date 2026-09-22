import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { IpcRequest } from '../../src/ipc/types';

const { mockRegisterTask, mockListTasks, mockUpdateTaskState } = vi.hoisted(() => ({
  mockRegisterTask: vi.fn().mockReturnValue('task-001'),
  mockListTasks: vi.fn().mockReturnValue([]),
  mockUpdateTaskState: vi.fn()
}));

vi.mock('../../src/task/taskStorage', () => ({
  registerTask: mockRegisterTask,
  listTasks: mockListTasks,
  updateTaskState: mockUpdateTaskState
}));

import { registerTask, listTasks, exitDaemon, updateTaskState } from '../../src/ipc/client';
import { handleMessage } from '../../src/ipc/server';

describe('ipc/client（集成测试：真实 socket）', () => {
  let server: net.Server;
  let socketPath: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipc-test-'));
    socketPath = path.join(tmpDir, 'test.sock');
    await new Promise<void>(resolve => {
      server = net.createServer(conn => {
        let buf = '';
        conn.on('data', (chunk: Buffer) => {
          buf += chunk.toString();
        });
        conn.on('end', () => {
          const req = JSON.parse(buf) as IpcRequest;
          const res = handleMessage(req);
          conn.end(JSON.stringify(res));
        });
      });
      server.listen(socketPath, () => resolve());
    });
  });

  afterEach(() => {
    server.close();
  });

  it('registerTask 通过 IPC 注册任务，返回 taskId', async () => {
    const result = await registerTask({ type: 'local_bash' }, socketPath);
    expect(result).toBe('task-001');
    expect(mockRegisterTask).toHaveBeenCalledWith({ type: 'local_bash' });
  });

  it('registerTask 支持传入完整 pane 信息（agentName/session/window/paneIndex）', async () => {
    const result = await registerTask(
      { type: 'local_agent', agentName: 'agent1', session: 'sess', window: 'win', paneIndex: 2 },
      socketPath
    );
    expect(result).toBe('task-001');
    expect(mockRegisterTask).toHaveBeenCalledWith({
      type: 'local_agent',
      agentName: 'agent1',
      session: 'sess',
      window: 'win',
      paneIndex: 2
    });
  });

  it('listTasks 通过 IPC 获取全部任务列表', async () => {
    const tasks = [
      { id: 'task-1', status: 'running' as const, type: 'local_bash' as const, createdAt: '' },
      { id: 'task-2', status: 'completed' as const, type: 'local_bash' as const, createdAt: '' }
    ];
    mockListTasks.mockReturnValue(tasks);
    const result = await listTasks(socketPath);
    expect(result).toEqual(tasks);
  });

  it('updateTaskState 通过 IPC 更新任务状态', async () => {
    await updateTaskState('task-001', 'running', socketPath);
    expect(mockUpdateTaskState).toHaveBeenCalledWith('task-001', 'running');
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
