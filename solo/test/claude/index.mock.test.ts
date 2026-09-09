import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trustFolder } from '../../src/claude';
import { waitForText } from '../../src/tmux';

// vi.hoisted: 共享 mock 引用
const { mockExecAsync } = vi.hoisted(() => ({
  mockExecAsync: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

// mock exec 模块：exec.fn 指向共享 mock
// pane.ts 中函数通过 exec.fn() 调用 → 走 mock
vi.mock('../../src/tmux/exec', () => ({
  exec: { fn: mockExecAsync }
}));

// waitForText 是轮询函数，mock 以隔离 trustFolder 的条件逻辑
vi.mock('../../src/tmux', async () => {
  const actual = await vi.importActual<typeof import('../../src/tmux')>('../../src/tmux');
  return { ...actual, waitForText: vi.fn().mockRejectedValue(new Error('Timed out')) };
});

const mockWaitForText = vi.mocked(waitForText);

describe('trustFolder', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
    mockWaitForText.mockClear().mockRejectedValue(new Error('Timed out'));
  });

  it('waitForText 检测到 Security guide 时发送回车键', async () => {
    mockWaitForText.mockResolvedValue(undefined);
    await trustFolder('sess:win.0');
    const sendKeysCalls = mockExecAsync.mock.calls.filter(c => String(c[0]).includes('send-keys'));
    expect(sendKeysCalls.length).toBe(1);
    expect(sendKeysCalls[0][0]).toBe('tmux send-keys -t sess:win.0 Enter');
  });

  it('waitForText 未检测到 Security guide（超时）时不发送按键', async () => {
    await trustFolder('sess:win.0');
    const sendKeysCalls = mockExecAsync.mock.calls.filter(c => String(c[0]).includes('send-keys'));
    expect(sendKeysCalls.length).toBe(0);
  });

  it('waitForText 超时不抛出错误，trustFolder 正常返回', async () => {
    mockWaitForText.mockRejectedValue(new Error('Timed out'));
    await expect(trustFolder('sess:win.0')).resolves.toBeUndefined();
  });
});
