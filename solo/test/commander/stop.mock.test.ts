import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

const { mockSessionExists, mockKillSession, mockValidateWorkspace, mockExitDaemon } = vi.hoisted(() => ({
  mockSessionExists: vi.fn(),
  mockKillSession: vi.fn(),
  mockValidateWorkspace: vi.fn().mockReturnValue('test-session'),
  mockExitDaemon: vi.fn()
}));

vi.mock('../../src/tmux', () => ({
  sessionExists: mockSessionExists,
  killSession: mockKillSession
}));

vi.mock('../../src/commander/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

vi.mock('../../src/ipc', () => ({
  exitDaemon: mockExitDaemon
}));

import { runStop } from '../../src/commander/stop';

describe('runStop', () => {
  let logs: string[];
  let spy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('session 存在时：killSession 终止 session 并调用 exitDaemon 退出 daemon', async () => {
    mockSessionExists.mockResolvedValue(true);
    mockKillSession.mockResolvedValue(undefined);
    await runStop();
    expect(mockKillSession).toHaveBeenCalledWith('test-session');
    expect(mockExitDaemon).toHaveBeenCalled();
    expect(mockExitDaemon.mock.invocationCallOrder[0]).toBeGreaterThan(mockKillSession.mock.invocationCallOrder[0]);
  });

  it('session 不存在时：不调用 killSession，仍调用 exitDaemon', async () => {
    mockSessionExists.mockResolvedValue(false);
    await runStop();
    expect(mockKillSession).not.toHaveBeenCalled();
    expect(mockExitDaemon).toHaveBeenCalled();
  });

  it('session 存在时输出绿色成功消息', async () => {
    mockSessionExists.mockResolvedValue(true);
    mockKillSession.mockResolvedValue(undefined);
    await runStop();
    expect(logs.some(l => l.includes('已终止'))).toBe(true);
  });

  it('session 不存在时输出黄色警告消息', async () => {
    mockSessionExists.mockResolvedValue(false);
    await runStop();
    expect(logs.some(l => l.includes('already terminated'))).toBe(true);
  });

  it('exitDaemon 抛出异常时向上传播', async () => {
    mockSessionExists.mockResolvedValue(true);
    mockKillSession.mockResolvedValue(undefined);
    mockExitDaemon.mockImplementation(() => {
      throw new Error('PID file not found');
    });
    await expect(runStop()).rejects.toThrow('PID file not found');
  });
});
