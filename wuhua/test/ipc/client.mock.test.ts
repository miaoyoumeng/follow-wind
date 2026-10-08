import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { IpcRequest } from '../../src/ipc/types';

const { mockDispatch } = vi.hoisted(() => ({
  mockDispatch: vi.fn().mockResolvedValue(true)
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

import { exitDaemon, ipcDispatch } from '../../src/ipc/client';
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

  it('ipcDispatch 通过 IPC 分发指令，返回 dispatched=true', async () => {
    mockDispatch.mockResolvedValueOnce(true);
    const result = await ipcDispatch('test-session', 'myagent', 0, 'hello world', socketPath);
    expect(result).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith('test-session', 'myagent', 0, { prompt: 'hello world' });
  });

  it('ipcDispatch 在 dispatch 抛异常时抛出错误而非挂起', async () => {
    mockDispatch.mockRejectedValueOnce(new Error('dispatch failed'));
    await expect(ipcDispatch('test-session', 'myagent', 0, 'hello', socketPath)).rejects.toThrow('dispatch failed');
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
