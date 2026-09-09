import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExecAsync } = vi.hoisted(() => ({
  mockExecAsync: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

vi.mock('../../src/tmux/exec', () => ({
  exec: { fn: mockExecAsync }
}));

import { capturePane, sendKeys, setPaneTitle, splitPane, waitForText, notifyCompletion, selectPane, listPanesWithTitle } from '../../src/tmux/pane';

describe('capturePane', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: 'pane content', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数，paneIndex 为 number，内部拼接 target', async () => {
    await capturePane('my-session', 'my-window', 0);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux capture-pane -t my-session:my-window.0 -p'
    );
  });

  it('window 名含连字符时仍正确拼接', async () => {
    await capturePane('sess', 'win-name', 2);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux capture-pane -t sess:win-name.2 -p'
    );
  });

  it('返回 stdout 内容', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'hello world', stderr: '' });
    const result = await capturePane('s', 'w', 0);
    expect(result).toBe('hello world');
  });

  it('指定 lines 时拼接 -S -N 选项', async () => {
    await capturePane('s', 'w', 0, 500);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux capture-pane -t s:w.0 -p -S -500'
    );
  });

  it('lines + joinWrapped 时拼接 -J 选项', async () => {
    await capturePane('s', 'w', 0, 1000, true);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux capture-pane -t s:w.0 -p -S -1000 -J'
    );
  });
});

describe('sendKeys', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数，键名不加引号', async () => {
    await sendKeys('sess', 'win', 0, 'Enter');
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux send-keys -t sess:win.0 Enter'
    );
  });

  it('文本内容加引号', async () => {
    await sendKeys('sess', 'win', 1, 'hello world');
    expect(mockExecAsync).toHaveBeenCalledWith(
      "tmux send-keys -t sess:win.1 'hello world'"
    );
  });

  it('paneIndex 为 number 类型', async () => {
    await sendKeys('s', 'w', 3, 'claude');
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux send-keys -t s:w.3 claude'
    );
  });
});

describe('setPaneTitle', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数加 title', async () => {
    await setPaneTitle('sess', 'win', 0, 'my-title');
    expect(mockExecAsync).toHaveBeenCalledWith(
      "tmux select-pane -t sess:win.0 -T 'my-title'"
    );
  });

  it('paneIndex 为 number 类型', async () => {
    await setPaneTitle('s', 'w', 2, 'cli');
    expect(mockExecAsync).toHaveBeenCalledWith(
      "tmux select-pane -t s:w.2 -T 'cli'"
    );
  });
});

describe('splitPane', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '3', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数，水平分屏', async () => {
    await splitPane('sess', 'win', 0, '-h');
    expect(mockExecAsync).toHaveBeenCalledWith(
      "tmux split-window -t sess:win.0 -h -P -F '#{pane_index}'"
    );
  });

  it('垂直分屏并指定工作目录', async () => {
    await splitPane('sess', 'win', 1, '-v', '/tmp/workspace');
    expect(mockExecAsync).toHaveBeenCalledWith(
      "tmux split-window -t sess:win.1 -v -c /tmp/workspace -P -F '#{pane_index}'"
    );
  });

  it('返回新 pane 的 index（number）', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '5', stderr: '' });
    const result = await splitPane('s', 'w', 0, '-h');
    expect(result).toBe(5);
  });
});

describe('waitForText', () => {
  beforeEach(() => {
    mockExecAsync.mockClear();
  });

  it('首次 capturePane 内容包含 fixed 字符串，立即返回', async () => {
    mockExecAsync.mockResolvedValue({ stdout: 'Hello World\nDone!', stderr: '' });
    const result = await waitForText('s', 'w', 0, 'Done', 'Done', 5000, 50, 1000);
    expect(result).toBeUndefined();
    // 只调用一次 capturePane（-S -lines -J）
    expect(mockExecAsync).toHaveBeenCalledTimes(1);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux capture-pane -t s:w.0 -p -S -1000 -J'
    );
  });

  it('首次未匹配，后续匹配后返回', async () => {
    mockExecAsync
      .mockResolvedValueOnce({ stdout: 'loading...', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'loading...\nDone!', stderr: '' });
    await waitForText('s', 'w', 0, 'Done', 'Done', 5000, 50, 1000);
    expect(mockExecAsync).toHaveBeenCalledTimes(2);
  });

  it('超时抛出错误', async () => {
    mockExecAsync.mockResolvedValue({ stdout: 'loading...', stderr: '' });
    await expect(
      waitForText('s', 'w', 0, 'Done', 'yes', 200, 50, 1000)
    ).rejects.toThrow('Timed out');
  });

  it('fixed 为空字符串时使用正则匹配', async () => {
    mockExecAsync.mockResolvedValue({ stdout: 'version 3.14 released', stderr: '' });
    await waitForText('s', 'w', 0, 'version \\d+\\.\\d+', '', 5000, 50, 1000);
    expect(mockExecAsync).toHaveBeenCalledTimes(1);
  });

  it('fixed 为空字符串时正则不匹配则继续轮询', async () => {
    mockExecAsync
      .mockResolvedValueOnce({ stdout: 'no match here', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'version 2.0 ready', stderr: '' });
    await waitForText('s', 'w', 0, 'version \\d+\\.\\d+', '', 5000, 50, 1000);
    expect(mockExecAsync).toHaveBeenCalledTimes(2);
  });

  it('capturePane 使用指定的 lines 参数', async () => {
    mockExecAsync.mockResolvedValue({ stdout: 'text', stderr: '' });
    await waitForText('s', 'w', 0, 'text', 'text', 5000, 50, 500);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux capture-pane -t s:w.0 -p -S -500 -J'
    );
  });
});

describe('notifyCompletion', () => {
  beforeEach(() => {
    mockExecAsync.mockClear();
  });

  it('先获取 pane 当前命令，再调用 agent-tracker 通知完成', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'claude', stderr: '' });
    await notifyCompletion('sess', 'win', '0');
    expect(mockExecAsync).toHaveBeenCalledTimes(2);
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      1,
      "tmux display-message -p -t sess:win.0 '#{pane_current_command}'"
    );
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('agent-tracker/bin/agent tracker command')
    );
  });

  it('通知命令包含正确的 window-id、pane 和 summary 参数', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'claude', stderr: '' });
    await notifyCompletion('sess', 'win', '0');
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('-window-id win')
    );
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('-pane 0')
    );
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('-summary')
    );
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('claude finished')
    );
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('notify')
    );
  });

  it('display-message 失败时不抛出错误', async () => {
    mockExecAsync.mockRejectedValueOnce(new Error('tmux error'));
    await expect(notifyCompletion('sess', 'win', '0')).resolves.toBeUndefined();
  });

  it('agent-tracker 调用失败时不抛出错误', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'claude', stderr: '' });
    mockExecAsync.mockRejectedValueOnce(new Error('agent not found'));
    await expect(notifyCompletion('sess', 'win', '0')).resolves.toBeUndefined();
  });
});

describe('selectPane', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数，拼接 select-pane 命令', async () => {
    await selectPane('sess', 'win', 0);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux select-pane -t sess:win.0'
    );
  });

  it('paneIndex 为 number 类型，正确拼接 target', async () => {
    await selectPane('my-session', 'my-window', 2);
    expect(mockExecAsync).toHaveBeenCalledWith(
      'tmux select-pane -t my-session:my-window.2'
    );
  });
});

describe('listPanesWithTitle', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('接受 session/window 两个参数，查询 pane index 和 title', async () => {
    await listPanesWithTitle('sess', 'win');
    expect(mockExecAsync).toHaveBeenCalledWith(
      "tmux list-panes -t sess:win -F '#{pane_index} #{pane_title}'"
    );
  });

  it('解析多行输出为 { index, title }[] 数组', async () => {
    mockExecAsync.mockResolvedValueOnce({
      stdout: '0 left\n1 claude\n2 right\n',
      stderr: ''
    });
    const result = await listPanesWithTitle('s', 'w');
    expect(result).toEqual([
      { index: 0, title: 'left' },
      { index: 1, title: 'claude' },
      { index: 2, title: 'right' }
    ]);
  });

  it('空输出返回空数组', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    const result = await listPanesWithTitle('s', 'w');
    expect(result).toEqual([]);
  });

  it('title 含空格时正确解析', async () => {
    mockExecAsync.mockResolvedValueOnce({
      stdout: '0 my pane title\n',
      stderr: ''
    });
    const result = await listPanesWithTitle('s', 'w');
    expect(result).toEqual([{ index: 0, title: 'my pane title' }]);
  });
});
