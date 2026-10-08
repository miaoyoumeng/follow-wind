import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExeca } = vi.hoisted(() => ({
  mockExeca: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

vi.mock('execa', () => ({
  execa: mockExeca
}));

import { getSessionName, getWindowName, getPaneIndex, getPaneName } from '../../src/tmux/displayMessage';

describe('getSessionName', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: 'my-session\n', stderr: '' });
  });

  it('调用 tmux display-message -p #S 获取当前 session 名称', async () => {
    await getSessionName();
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['display-message', '-p', '#S']);
  });

  it('返回 trim 后的 session 名称', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: 'my-session\n', stderr: '' });
    const result = await getSessionName();
    expect(result).toBe('my-session');
  });

  it('不在 tmux 环境时抛出错误', async () => {
    mockExeca.mockRejectedValueOnce(new Error('no tmux'));
    await expect(getSessionName()).rejects.toThrow();
  });
});

describe('getWindowName', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: 'my-window\n', stderr: '' });
  });

  it('调用 tmux display-message -p #W 获取当前 window 名称', async () => {
    await getWindowName();
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['display-message', '-p', '#W']);
  });

  it('返回 trim 后的 window 名称', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: 'dev-window\n', stderr: '' });
    const result = await getWindowName();
    expect(result).toBe('dev-window');
  });

  it('不在 tmux 环境时抛出错误', async () => {
    mockExeca.mockRejectedValueOnce(new Error('no tmux'));
    await expect(getWindowName()).rejects.toThrow();
  });
});

describe('getPaneIndex', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '0\n', stderr: '' });
  });

  it('调用 tmux display-message -p #P 获取当前 pane 索引', async () => {
    await getPaneIndex();
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['display-message', '-p', '#P']);
  });

  it('返回 number 类型的 pane 索引', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: '3\n', stderr: '' });
    const result = await getPaneIndex();
    expect(result).toBe(3);
    expect(typeof result).toBe('number');
  });

  it('不在 tmux 环境时抛出错误', async () => {
    mockExeca.mockRejectedValueOnce(new Error('no tmux'));
    await expect(getPaneIndex()).rejects.toThrow();
  });
});

describe('getPaneName', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: 'my-pane\n', stderr: '' });
  });

  it('调用 tmux display-message -p #T 获取当前 pane 标题', async () => {
    await getPaneName();
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['display-message', '-p', '#T']);
  });

  it('返回 trim 后的 pane 标题', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: 'claude\n', stderr: '' });
    const result = await getPaneName();
    expect(result).toBe('claude');
  });

  it('不在 tmux 环境时抛出错误', async () => {
    mockExeca.mockRejectedValueOnce(new Error('no tmux'));
    await expect(getPaneName()).rejects.toThrow();
  });
});
