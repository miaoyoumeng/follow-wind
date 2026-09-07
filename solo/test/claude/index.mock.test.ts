import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startClaude, trustFolder } from '../../src/claude';
import { delay } from '../../src/claude/delay';

// vi.hoisted: 共享 mock 引用
const { mockExecAsync } = vi.hoisted(() => ({
  mockExecAsync: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

// mock exec 模块：exec.fn 指向共享 mock
// pane.ts 中函数通过 exec.fn() 调用 → 走 mock
vi.mock('../../src/tmux/exec', () => ({
  exec: { fn: mockExecAsync }
}));

// delay 是独立模块，mock 为立即返回以加速测试
vi.mock('../../src/claude/delay', () => ({
  delay: vi.fn().mockResolvedValue(undefined)
}));

describe('trustFolder', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('检测到 Security guide 时发送回车键（tmux 键名 Enter，不加引号）', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'Security guide\n1. Yes, I trust this folder', stderr: '' });
    await trustFolder('sess:win.0');
    const sendKeysCalls = mockExecAsync.mock.calls.filter(c => String(c[0]).includes('send-keys'));
    expect(sendKeysCalls.length).toBe(1);
    expect(sendKeysCalls[0][0]).toBe('tmux send-keys -t sess:win.0 Enter');
  });

  it('未检测到 Security guide 时只执行 capture-pane，不发送按键', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'Welcome to Claude', stderr: '' });
    await trustFolder('sess:win.0');
    expect(mockExecAsync).toHaveBeenCalledTimes(1);
    expect(mockExecAsync).toHaveBeenCalledWith('tmux capture-pane -t sess:win.0 -p');
  });

  it('capture-pane 返回空内容时不发送按键', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    await trustFolder('sess:win.0');
    expect(mockExecAsync).toHaveBeenCalledTimes(1);
  });
});

describe('startClaude', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('向目标 pane 输入 claude 文本', async () => {
    await startClaude('sess:win.0');
    expect(mockExecAsync).toHaveBeenNthCalledWith(1, 'tmux send-keys -t sess:win.0 claude');
  });

  it('输入 claude 后按回车键启动', async () => {
    await startClaude('sess:win.0');
    expect(mockExecAsync).toHaveBeenNthCalledWith(2, 'tmux send-keys -t sess:win.0 Enter');
  });

  it('claude 启动后调用 trustFolder 检查信任提示', async () => {
    await startClaude('sess:win.0');
    // 调用序列：sendKeys claude → sendKeys Enter → capture-pane（trustFolder 因空内容不发 Enter）
    expect(mockExecAsync).toHaveBeenCalledTimes(3);
    expect(mockExecAsync).toHaveBeenNthCalledWith(3, 'tmux capture-pane -t sess:win.0 -p');
  });

  it('4 个流程严格串行执行，每步在前一步完成后才开始', async () => {
    const order: string[] = [];
    const wait = (ms: number, tag: string) => new Promise<void>(resolve => {
      order.push(`${tag}S`);
      setTimeout(() => {
        order.push(`${tag}E`);
        resolve();
      }, ms);
    });

    let execCallCount = 0;
    mockExecAsync.mockImplementation(async () => {
      execCallCount++;
      const n = execCallCount;
      if (n === 1) await wait(1, 's1'); // sendKeys claude
      else if (n === 2) await wait(1, 's2'); // sendKeys Enter
      else if (n === 3) await wait(0, 'c'); // capturePane (trustFolder)
      return { stdout: '', stderr: '' };
    });
    vi.mocked(delay).mockImplementationOnce(() => wait(5, 'd'));

    await startClaude('sess:win.0');

    // 验证严格串行：每步的 S（开始）必须在前一步 E（结束）之后
    const idx = (tag: string) => order.indexOf(tag);
    expect(idx('s1S')).toBeLessThan(idx('s1E'));
    expect(idx('s1E')).toBeLessThan(idx('s2S'));
    expect(idx('s2E')).toBeLessThan(idx('dS'));
    expect(idx('dE')).toBeLessThan(idx('cS'));
  });
});
