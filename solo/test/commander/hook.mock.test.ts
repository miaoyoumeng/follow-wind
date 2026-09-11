import { describe, it, expect } from 'vitest';
import { runHook } from '../../src/commander/hook';

describe('runHook', () => {
  describe('name 校验', () => {
    it('name 不在 tmux hook 池中时，抛出错误', () => {
      expect(() =>
        runHook({ name: 'not-a-hook', sessionName: 's', windowName: 'w', paneIndex: '0' })
      ).toThrow('未知 hook 事件');
    });
  });
});
