import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInfo } = vi.hoisted(() => ({ mockInfo: vi.fn() }));

// logging 模块是日志输出依赖，mock 以隔离 runHook 的日志写入逻辑
vi.mock(import('../../src/logging'), () => ({
  info: mockInfo,
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getLoggingConfig: vi.fn(),
  setup: vi.fn(),
  reset: vi.fn()
}));

import { runHook } from '../../src/commander/hook';

describe('runHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('name 校验', () => {
    it('name 不在 tmux hook 池中时，抛出错误', () => {
      expect(() =>
        runHook({ name: 'not-a-hook', sessionName: 's', windowName: 'w', paneIndex: '0' })
      ).toThrow('未知 hook 事件');
    });
  });

  describe('合法 hook 事件', () => {
    it('after-send-keys 合法，通过 info 写入全部参数', () => {
      runHook({
        name: 'after-send-keys',
        sessionName: 'my-session',
        windowName: 'console',
        paneIndex: '2'
      });

      expect(mockInfo).toHaveBeenCalledTimes(1);
      const output = mockInfo.mock.calls[0][0] as string;
      expect(output).toContain('after-send-keys');
      expect(output).toContain('my-session');
      expect(output).toContain('console');
      expect(output).toContain('2');
    });

    it('alert-activity 合法，同样通过 info 写入参数', () => {
      runHook({
        name: 'alert-activity',
        sessionName: 'sess',
        windowName: 'win',
        paneIndex: '0'
      });

      expect(mockInfo).toHaveBeenCalledTimes(1);
      const output = mockInfo.mock.calls[0][0] as string;
      expect(output).toContain('alert-activity');
    });
  });
});
