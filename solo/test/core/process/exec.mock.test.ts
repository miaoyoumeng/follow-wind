import { describe, it, expect, vi } from 'vitest';

// mock child_process.exec
const mockExec = vi.fn();

vi.mock('child_process', () => ({
  exec: (...args: unknown[]) => mockExec(...args)
}));

import { execAsync } from '../../../src/core/process';

describe('execAsync', () => {
  it('应该是一个函数', () => {
    expect(typeof execAsync).toBe('function');
  });

  it('调用时应该委托给 child_process.exec 并返回 Promise', async () => {
    const fakeStdout = 'hello';
    mockExec.mockImplementation((_cmd: string, cb: (err: null, result: { stdout: string }) => void) => {
      cb(null, { stdout: fakeStdout });
    });

    const result = await execAsync('echo hello');
    expect(result.stdout).toBe(fakeStdout);
    expect(mockExec).toHaveBeenCalledTimes(1);
  });
});
