import { describe, it, expect, vi } from 'vitest';
import { BaseEnvHandler, type EnvHandler, type EnvCheckResult } from '../../src/envs';

// 测试用 Handler 实现
class MockHandler extends BaseEnvHandler {
  constructor(
    private name: string,
    private result: Partial<EnvCheckResult>
  ) {
    super();
  }

  async handle(): Promise<EnvCheckResult> {
    return { ...this.result } as EnvCheckResult;
  }
}

describe('envs 责任链模式', () => {
  describe('BaseEnvHandler', () => {
    it('setNext 返回下一个 handler 以支持链式调用', () => {
      const handler1 = new MockHandler('h1', {});
      const handler2 = new MockHandler('h2', {});

      const returned = handler1.setNext(handler2);

      expect(returned).toBe(handler2);
    });

    it('链式设置多个 handler', () => {
      const h1 = new MockHandler('h1', {});
      const h2 = new MockHandler('h2', {});
      const h3 = new MockHandler('h3', {});

      h1.setNext(h2).setNext(h3);

      // 验证链可以执行
      expect(h1.getNext()).toBe(h2);
      expect(h2.getNext()).toBe(h3);
    });
  });

  describe('runEnvHandlers', () => {
    it('执行单个 handler 并返回结果', async () => {
      const { runEnvHandlers } = await import('../../src/envs');
      const handler = new MockHandler('settings', {
        settings: { exists: true, path: '/test/config' },
      });

      const result = await runEnvHandlers(handler);

      expect(result.settings).toEqual({ exists: true, path: '/test/config' });
    });

    it('执行链式 handlers 并合并结果', async () => {
      const { runEnvHandlers } = await import('../../src/envs');
      const h1 = new MockHandler('settings', {
        settings: { exists: true, path: '/test/config' },
      });
      const h2 = new MockHandler('claude', {
        claude: { installed: true, version: '1.0.0' },
      });
      const h3 = new MockHandler('tmux', {
        tmux: { installed: false },
      });

      h1.setNext(h2).setNext(h3);

      const result = await runEnvHandlers(h1);

      expect(result.settings).toEqual({ exists: true, path: '/test/config' });
      expect(result.claude).toEqual({ installed: true, version: '1.0.0' });
      expect(result.tmux).toEqual({ installed: false });
    });
  });
});
