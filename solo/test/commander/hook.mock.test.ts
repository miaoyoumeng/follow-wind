import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { runHook } from '../../src/commander/hook';

describe('runHook', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('name 校验', () => {
    it('name 不在 tmux hook 池中时，抛出错误', () => {
      expect(() =>
        runHook({ name: 'not-a-hook', sessionName: 's', windowName: 'w', paneIndex: '0', paneId: '%1' })
      ).toThrow('未知 hook 事件');
    });
  });

  describe('合法 hook 事件', () => {
    it('after-send-keys 合法，打印全部参数', () => {
      runHook({
        name: 'after-send-keys',
        sessionName: 'my-session',
        windowName: 'console',
        paneIndex: '2',
        paneId: '%42'
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('after-send-keys');
      expect(output).toContain('my-session');
      expect(output).toContain('console');
      expect(output).toContain('2');
      expect(output).toContain('%42');
    });

    it('alert-activity 合法，同样打印参数', () => {
      runHook({
        name: 'alert-activity',
        sessionName: 'sess',
        windowName: 'win',
        paneIndex: '0',
        paneId: '%0'
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('alert-activity');
    });
  });
});
