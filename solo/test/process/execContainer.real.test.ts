import { describe, it, expect, beforeEach } from 'vitest';
import { exec, execAsync } from '../../src/process';

describe('exec 容器', () => {
  it('exec.fn 应该是一个函数', () => {
    expect(typeof exec.fn).toBe('function');
  });

  it('exec.fn 默认应指向 execAsync', () => {
    expect(exec.fn).toBe(execAsync);
  });

  describe('exec.fn 可替换', () => {
    const originalFn = exec.fn;

    beforeEach(() => {
      exec.fn = originalFn;
    });

    it('替换后调用应使用新函数', async () => {
      const fakeResult = { stdout: 'fake-out', stderr: '' };
      const fakeFn = async (_cmd: string) => fakeResult;

      exec.fn = fakeFn;

      const result = await exec.fn('any-command');
      expect(result).toBe(fakeResult);
    });

    it('替换只影响 exec.fn，不影响 execAsync 本身', () => {
      const beforeAsync = execAsync;
      exec.fn = async () => ({ stdout: '', stderr: '' });
      expect(execAsync).toBe(beforeAsync);
    });
  });
});
