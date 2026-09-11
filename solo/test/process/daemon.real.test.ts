import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';
import { mkdirSync, existsSync } from 'fs';
import { SOLO_DIR, IPC_SOCKET_PATH } from '../../src/config/paths';
import { startDaemon, stopDaemon } from '../../src/process/daemon';
import { stopIpcServer } from '../../src/ipc/ipcServer';

/** 通过 Unix socket 发送 IPC 请求 */
const sendIpcRequest = (req: object): Promise<object> => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(IPC_SOCKET_PATH, () => {
      client.end(JSON.stringify(req));
    });
    let data = '';
    client.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    client.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    client.on('error', reject);
  });
};

describe('daemon IPC integration', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.useFakeTimers();
    if (!existsSync(SOLO_DIR)) mkdirSync(SOLO_DIR, { recursive: true });
  });

  afterEach(() => {
    stopDaemon();
    stopIpcServer();
    vi.useRealTimers();
    mockExit.mockRestore();
    spy.mockRestore();
  });

  it('IPC 请求 statTask 返回响应', async () => {
    startDaemon();
    const res = (await sendIpcRequest({ id: 'test-1', method: 'statTask' })) as {
      id: string;
      success: boolean;
      data: { stat: object };
    };
    expect(res.id).toBe('test-1');
    expect(res.success).toBe(true);
    expect(res.data.stat).toBeDefined();
  });

  it('IPC 请求 exit 返回响应，setImmediate 触发 process.exit(0)', async () => {
    startDaemon();
    const res = (await sendIpcRequest({ id: 'test-2', method: 'exit' })) as {
      id: string;
      success: boolean;
    };
    expect(res.id).toBe('test-2');
    expect(res.success).toBe(true);
    // exit handler 通过 setImmediate 异步调用 process.exit(0)
    // 推进定时器触发（process.exit 已被 mock，不会真正退出）
    await vi.advanceTimersByTimeAsync(100);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
});
