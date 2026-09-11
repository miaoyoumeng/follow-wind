import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const { mockRegisterTask, mockGetRunningTasks, mockStatTask, mockUpdateTaskState } = vi.hoisted(() => ({
  mockRegisterTask: vi.fn().mockReturnValue('task-001'),
  mockGetRunningTasks: vi.fn().mockReturnValue([]),
  mockStatTask: vi.fn().mockReturnValue({ pending: 1, running: 2, completed: 3, timeout: 0, failed: 0, killed: 0 }),
  mockUpdateTaskState: vi.fn()
}));

vi.mock('../../src/task/taskStorage', () => ({
  registerTask: mockRegisterTask,
  getRunningTasks: mockGetRunningTasks,
  statTask: mockStatTask,
  updateTaskState: mockUpdateTaskState
}));

import { registerTask, getRunningTasks, statTask, exitDaemon, updateTaskState } from '../../src/ipc/client';
import { handleMessage } from '../../src/ipc/server';
import { IPC_SOCKET_PATH } from '../../src/config/paths';

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
          const req = JSON.parse(buf);
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

  it('getRunningTasks 通过 IPC 获取运行中的任务', async () => {
    const tasks = [{ id: 'task-1', status: 'running' as const }];
    mockGetRunningTasks.mockReturnValue(tasks);
    const result = await getRunningTasks(socketPath);
    expect(result).toEqual(tasks);
  });

  it('statTask 通过 IPC 获取各状态统计', async () => {
    const result = await statTask(socketPath);
    expect(result).toEqual({ pending: 1, running: 2, completed: 3, timeout: 0, failed: 0, killed: 0 });
  });

  it('updateTaskState 通过 IPC 更新任务状态', async () => {
    await updateTaskState('task-001', 'running', socketPath);
    expect(mockUpdateTaskState).toHaveBeenCalledWith('task-001', 'running');
  });

});

describe('exitDaemon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 确保默认 socket 文件不存在，使 exitDaemon 连接失败
    try {
      fs.unlinkSync(IPC_SOCKET_PATH);
    } catch {
      // ignore
    }
  });

  it('daemon 未运行时（socket 文件不存在）抛出连接错误', async () => {
    await expect(exitDaemon()).rejects.toThrow();
  });

  it('daemon 未运行时（socket 文件不存在）使用自定义路径也抛出错误', async () => {
    await expect(exitDaemon('/tmp/nonexistent-ipc.sock')).rejects.toThrow();
  });
});
