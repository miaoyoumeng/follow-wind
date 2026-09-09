import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetLoggingConfig, mockSetup, mockInfo } = vi.hoisted(() => ({
  mockGetLoggingConfig: vi.fn(),
  mockSetup: vi.fn(),
  mockInfo: vi.fn()
}));

// commander 是外部 CLI 框架，mock 以阻止 program.parse() 执行
vi.mock('commander', () => {
  const proxy = new Proxy(function () {} as unknown as Record<string, unknown>, {
    get: (_t, prop) => (prop === 'then' ? undefined : proxy),
    apply: () => proxy
  });
  class MockCommand {
    constructor() { return proxy; }
  }
  return { Command: MockCommand };
});

// logging 模块是上层业务依赖，mock 以隔离 initLogger 的初始化逻辑
vi.mock(import('../../src/logging'), () => ({
  getLoggingConfig: mockGetLoggingConfig,
  setup: mockSetup,
  info: mockInfo,
  debug: mockInfo,
  warn: mockInfo,
  error: mockInfo,
  reset: vi.fn()
}));

import { initLogger } from '../../src/bin/solo';

describe('initLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('配置 logging 段时，调用 setup 初始化日志模块', () => {
    mockGetLoggingConfig.mockReturnValue({ level: 'debug', file: '/tmp/solo.log' });
    initLogger();
    expect(mockSetup).toHaveBeenCalledWith({ level: 'debug', file: '/tmp/solo.log' });
  });

  it('未配置 logging 段时，不调用 setup', () => {
    mockGetLoggingConfig.mockReturnValue(null);
    initLogger();
    expect(mockSetup).not.toHaveBeenCalled();
  });
});
