import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockStatTask, mockStartIpcServer, mockStopIpcServer } = vi.hoisted(() => ({
  mockStatTask: vi.fn().mockReturnValue({ pending: 0, running: 0, completed: 0, timeout: 0, failed: 0, killed: 0 }),
  mockStartIpcServer: vi.fn((_onExit: () => void, onListening?: () => void) => {
    onListening?.();
  }),
  mockStopIpcServer: vi.fn()
}));

vi.mock('../../src/task/taskStorage', () => ({
  statTask: mockStatTask
}));

vi.mock('../../src/ipc/ipcServer', () => ({
  startIpcServer: mockStartIpcServer,
  stopIpcServer: mockStopIpcServer
}));

import { startDaemon, stopDaemon } from '../../src/process/daemon';

describe('startDaemon / stopDaemon', () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setIntervalSpy = vi.spyOn(global, 'setInterval').mockReturnValue(42 as unknown as ReturnType<typeof setInterval>);
    clearIntervalSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
  });

  afterEach(() => {
    // 确保每次测试后 heartbeatId 被重置
    stopDaemon();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('startDaemon 启动 IPC 服务端并返回 stop 函数', () => {
    const stop = startDaemon();
    expect(typeof stop).toBe('function');
    expect(mockStartIpcServer).toHaveBeenCalledTimes(1);
    expect(typeof mockStartIpcServer.mock.calls[0][0]).toBe('function');
    expect(setIntervalSpy).toHaveBeenCalled();
  });

  it('startDaemon 重复调用时不重复启动', () => {
    startDaemon();
    startDaemon();
    expect(mockStartIpcServer).toHaveBeenCalledTimes(1);
  });

  it('stopDaemon 清除心跳并停止 IPC 服务端', () => {
    startDaemon();
    stopDaemon();
    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(mockStopIpcServer).toHaveBeenCalled();
  });

  it('stopDaemon 未启动时调用为 no-op', () => {
    stopDaemon();
    expect(clearIntervalSpy).not.toHaveBeenCalled();
    expect(mockStopIpcServer).not.toHaveBeenCalled();
  });

  it('startDaemon 传入的 onExit 回调调用 stopDaemon', () => {
    startDaemon();
    const onExit = mockStartIpcServer.mock.calls[0][0] as () => void;
    onExit();
    expect(mockStopIpcServer).toHaveBeenCalled();
  });
});
