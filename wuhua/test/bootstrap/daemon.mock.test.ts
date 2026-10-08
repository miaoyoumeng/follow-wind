import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadPidFile, mockIsProcessAlive } = vi.hoisted(() => ({
  mockReadPidFile: vi.fn(),
  mockIsProcessAlive: vi.fn()
}));

vi.mock('../../src/bootstrap/pid', () => ({
  readPidFile: (...args: unknown[]): unknown => mockReadPidFile(...(args as [])),
  isProcessAlive: (...args: unknown[]): unknown => mockIsProcessAlive(...(args as []))
}));

import { isDaemonRunning } from '../../src/bootstrap/daemon';

describe('isDaemonRunning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pid 文件不存在时返回 false', () => {
    mockReadPidFile.mockReturnValue(null);

    expect(isDaemonRunning()).toBe(false);
    expect(mockIsProcessAlive).not.toHaveBeenCalled();
  });

  it('pid 存在且进程存活时返回 true', () => {
    mockReadPidFile.mockReturnValue(12345);
    mockIsProcessAlive.mockReturnValue(true);

    expect(isDaemonRunning()).toBe(true);
    expect(mockIsProcessAlive).toHaveBeenCalledWith(12345);
  });

  it('pid 存在但进程不存活时返回 false', () => {
    mockReadPidFile.mockReturnValue(12345);
    mockIsProcessAlive.mockReturnValue(false);

    expect(isDaemonRunning()).toBe(false);
    expect(mockIsProcessAlive).toHaveBeenCalledWith(12345);
  });
});
