import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExeca } = vi.hoisted(() => ({
  mockExeca: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

vi.mock('execa', () => ({
  execa: mockExeca
}));

import { capturePane, sendKeys, setPaneTitle, splitPane, selectPane, listPanesWithTitle } from '../../src/tmux/pane';

describe('capturePane', () => {
  // execa 默认会裁掉 stdout 末尾换行，而 capturePane 的返回值直接落盘，必须显式保留
  const keepFinalNewline = { stripFinalNewline: false };

  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: 'pane content', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数，paneIndex 为 number，内部拼接 target', async () => {
    await capturePane('my-session', 'my-window', 0);
    expect(mockExeca).toHaveBeenCalledWith(
      'tmux',
      ['capture-pane', '-t', 'my-session:my-window.0', '-p'],
      keepFinalNewline
    );
  });

  it('window 名含连字符时仍正确拼接', async () => {
    await capturePane('sess', 'win-name', 2);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['capture-pane', '-t', 'sess:win-name.2', '-p'], keepFinalNewline);
  });

  it('返回 stdout 内容', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: 'hello world', stderr: '' });
    const result = await capturePane('s', 'w', 0);
    expect(result).toBe('hello world');
  });

  it('指定 lines 时拼接 -S -N 选项', async () => {
    await capturePane('s', 'w', 0, 500);
    expect(mockExeca).toHaveBeenCalledWith(
      'tmux',
      ['capture-pane', '-t', 's:w.0', '-p', '-S', '-500'],
      keepFinalNewline
    );
  });

  it('lines + joinWrapped 时拼接 -J 选项', async () => {
    await capturePane('s', 'w', 0, 1000, true);
    expect(mockExeca).toHaveBeenCalledWith(
      'tmux',
      ['capture-pane', '-t', 's:w.0', '-p', '-S', '-1000', '-J'],
      keepFinalNewline
    );
  });
});

describe('sendKeys', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('默认追加 Enter：Enter 作为末位参数随文本一次发送', async () => {
    await sendKeys('sess', 'win', 0, 'hello world');
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['send-keys', '-t', 'sess:win.0', 'hello world', 'Enter']);
  });

  it('多行文本：文本与 Enter 分两次发送，避免 Enter 随粘贴内容一起被吞掉', async () => {
    await sendKeys('sess', 'win', 0, 'line1\nline2');

    expect(mockExeca).toHaveBeenCalledTimes(2);
    expect(mockExeca).toHaveBeenNthCalledWith(1, 'tmux', ['send-keys', '-t', 'sess:win.0', 'line1\nline2']);
    expect(mockExeca).toHaveBeenNthCalledWith(2, 'tmux', ['send-keys', '-t', 'sess:win.0', 'Enter']);
  });

  it('多行文本且 enter=false：只发内容，不追加 Enter', async () => {
    await sendKeys('sess', 'win', 0, 'line1\nline2', false);

    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['send-keys', '-t', 'sess:win.0', 'line1\nline2']);
  });

  it('enter=false 时只发一次文本，不追加 Enter', async () => {
    await sendKeys('sess', 'win', 1, 'hello world', false);
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['send-keys', '-t', 'sess:win.1', 'hello world']);
  });

  it('文本内容作为单个参数原样传递，无需 shell 转义', async () => {
    await sendKeys('sess', 'win', 1, "it's a test");
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['send-keys', '-t', 'sess:win.1', "it's a test", 'Enter']);
  });

  it('paneIndex 为 number 类型，正确拼接 target', async () => {
    await sendKeys('s', 'w', 3, 'claude');
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['send-keys', '-t', 's:w.3', 'claude', 'Enter']);
  });
});

describe('setPaneTitle', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数加 title', async () => {
    await setPaneTitle('sess', 'win', 0, 'my-title');
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['select-pane', '-t', 'sess:win.0', '-T', 'my-title']);
  });

  it('paneIndex 为 number 类型', async () => {
    await setPaneTitle('s', 'w', 2, 'cli');
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['select-pane', '-t', 's:w.2', '-T', 'cli']);
  });
});

describe('splitPane', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '3', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数，水平分屏', async () => {
    await splitPane('sess', 'win', 0, '-h');
    expect(mockExeca).toHaveBeenCalledWith('tmux', [
      'split-window',
      '-t',
      'sess:win.0',
      '-h',
      '-P',
      '-F',
      '#{pane_index}'
    ]);
  });

  it('垂直分屏并指定工作目录', async () => {
    await splitPane('sess', 'win', 1, '-v', '/tmp/workspace');
    expect(mockExeca).toHaveBeenCalledWith('tmux', [
      'split-window',
      '-t',
      'sess:win.1',
      '-v',
      '-c',
      '/tmp/workspace',
      '-P',
      '-F',
      '#{pane_index}'
    ]);
  });

  it('返回新 pane 的 index（number）', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: '5', stderr: '' });
    const result = await splitPane('s', 'w', 0, '-h');
    expect(result).toBe(5);
  });
});

describe('selectPane', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('接受 session/window/paneIndex 三个参数，拼接 select-pane 命令', async () => {
    await selectPane('sess', 'win', 0);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['select-pane', '-t', 'sess:win.0']);
  });

  it('paneIndex 为 number 类型，正确拼接 target', async () => {
    await selectPane('my-session', 'my-window', 2);
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['select-pane', '-t', 'my-session:my-window.2']);
  });
});

describe('listPanesWithTitle', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('接受 session/window 两个参数，查询 pane index 和 title', async () => {
    await listPanesWithTitle('sess', 'win');
    expect(mockExeca).toHaveBeenCalledWith('tmux', [
      'list-panes',
      '-t',
      'sess:win',
      '-F',
      '#{pane_index} #{pane_title}'
    ]);
  });

  it('解析多行输出为 { index, title }[] 数组', async () => {
    mockExeca.mockResolvedValueOnce({
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
    mockExeca.mockResolvedValueOnce({ stdout: '', stderr: '' });
    const result = await listPanesWithTitle('s', 'w');
    expect(result).toEqual([]);
  });

  it('title 含空格时正确解析', async () => {
    mockExeca.mockResolvedValueOnce({
      stdout: '0 my pane title\n',
      stderr: ''
    });
    const result = await listPanesWithTitle('s', 'w');
    expect(result).toEqual([{ index: 0, title: 'my pane title' }]);
  });
});
