import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockTrace, mockInfo } = vi.hoisted(() => ({
  mockTrace: vi.fn(),
  mockInfo: vi.fn()
}));

vi.mock('../../src/logging', () => ({
  logger: {
    trace: mockTrace,
    debug: vi.fn(),
    info: mockInfo,
    warn: vi.fn(),
    error: vi.fn()
  } as unknown
}));

import { startHeartbeat, stopHeartbeat } from '../../src/bootstrap/heartbeat';

describe('heartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopHeartbeat();
    vi.useRealTimers();
  });

  it('startHeartbeat 启动后，每 60 秒输出一次 debug 日志', () => {
    startHeartbeat();

    vi.advanceTimersByTime(60_000);
    expect(mockTrace).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(mockTrace).toHaveBeenCalledTimes(2);
  });

  it('stopHeartbeat 停止后不再输出日志', () => {
    startHeartbeat();
    vi.advanceTimersByTime(60_000);
    expect(mockTrace).toHaveBeenCalledTimes(1);

    stopHeartbeat();
    vi.advanceTimersByTime(120_000);
    expect(mockTrace).toHaveBeenCalledTimes(1);
  });

  it('重复调用 startHeartbeat 不会创建多个定时器', () => {
    startHeartbeat();
    startHeartbeat();

    vi.advanceTimersByTime(60_000);
    expect(mockTrace).toHaveBeenCalledTimes(1);
  });

  it('stopHeartbeat 未启动时调用不报错', () => {
    expect(() => stopHeartbeat()).not.toThrow();
  });
});
