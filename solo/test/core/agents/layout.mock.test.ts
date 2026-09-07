import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { panesLayout } from '../../../src/core/agents/layout';
import { splitPane, setPaneTitle } from '../../../src/tmux';
import { startClaude } from '../../../src/claude';

// tmux 命令是外部依赖，mock 以隔离布局编排逻辑
vi.mock('../../../src/tmux', () => ({
  splitPane: vi.fn().mockResolvedValue(2),
  setPaneTitle: vi.fn().mockResolvedValue(undefined)
}));

// claude 启动是外部副作用，mock 以隔离布局逻辑
vi.mock('../../../src/claude', () => ({
  startClaude: vi.fn().mockResolvedValue(undefined)
}));

const mockSplitPane = vi.mocked(splitPane);
const mockSetPaneTitle = vi.mocked(setPaneTitle);
const mockStartClaude = vi.mocked(startClaude);

describe('panesLayout', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockSplitPane.mockClear();
    mockSetPaneTitle.mockClear();
    mockStartClaude.mockClear();
    mockSplitPane.mockResolvedValue(2);
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('1-pane：不 split，设置标题', async () => {
    await panesLayout('sess', 'win', { left: 'claude' }, null, null, 1, '/tmp');
    expect(mockSplitPane).not.toHaveBeenCalled();
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.1', 'claude');
  });

  it('2-pane horizontal：一次 -h split，设置两个标题', async () => {
    await panesLayout('sess', 'win', { left: 'claude', right: 'shell' }, null, 'h', 1, '/tmp');
    expect(mockSplitPane).toHaveBeenCalledWith('sess:win.1', '-h', '/tmp');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.1', 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.2', 'shell');
  });

  it('2-pane vertical：一次 -v split，设置两个标题', async () => {
    await panesLayout('sess', 'win', { 'left-top': 'claude', 'left-bottom': 'shell' }, null, 'v', 1, '/tmp');
    expect(mockSplitPane).toHaveBeenCalledWith('sess:win.1', '-v', '/tmp');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.1', 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.2', 'shell');
  });

  it('3-pane left-split：两次 split，设置三个标题', async () => {
    // 第 1 次 split → 返回 2；第 2 次 split → 返回 3
    let callCount = 0;
    mockSplitPane.mockImplementation(async () => {
      callCount++;
      return callCount === 1 ? 2 : 3;
    });

    const plan = {
      pattern: 'left-split' as const,
      steps: [
        { orientation: '-h' as const, target: 'original' as const },
        { orientation: '-v' as const, target: 'right' as const }
      ],
      paneMap: { left: 1, 'right-top': 2, 'right-bottom': 3 }
    };
    await panesLayout(
      'sess',
      'win',
      { left: 'claude', 'right-top': 'shell', 'right-bottom': 'git' },
      plan,
      null,
      1,
      '/tmp'
    );
    expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess:win.1', '-h', '/tmp');
    expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess:win.2', '-v', '/tmp');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.1', 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.2', 'shell');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.3', 'git');
  });

  it('3-pane right-split：两次 split，设置三个标题', async () => {
    let callCount = 0;
    mockSplitPane.mockImplementation(async () => {
      callCount++;
      return callCount === 1 ? 2 : 3;
    });

    const plan = {
      pattern: 'right-split' as const,
      steps: [
        { orientation: '-h' as const, target: 'original' as const },
        { orientation: '-v' as const, target: 'left' as const }
      ],
      paneMap: { 'left-top': 1, right: 2, 'left-bottom': 3 }
    };
    await panesLayout(
      'sess',
      'win',
      { right: 'claude', 'left-top': 'shell', 'left-bottom': 'git' },
      plan,
      null,
      1,
      '/tmp'
    );
    expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess:win.1', '-h', '/tmp');
    expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess:win.1', '-v', '/tmp');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.1', 'shell');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.2', 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess:win.3', 'git');
  });

  it('tag === "claude" 时调用 startClaude，target 为 pane 定位', async () => {
    await panesLayout('sess', 'win', { left: 'claude' }, null, null, 1, '/tmp');
    expect(mockStartClaude).toHaveBeenCalledWith('sess:win.1');
  });

  it('多个 pane，只对 tag === "claude" 的 pane 调用 startClaude', async () => {
    await panesLayout('sess', 'win', { left: 'claude', right: 'shell' }, null, 'h', 1, '/tmp');
    expect(mockStartClaude).toHaveBeenCalledWith('sess:win.1');
    expect(mockStartClaude).toHaveBeenCalledTimes(1);
  });

  it('无 "claude" tag 时不调用 startClaude', async () => {
    await panesLayout('sess', 'win', { left: 'shell', right: 'git' }, null, 'h', 1, '/tmp');
    expect(mockStartClaude).not.toHaveBeenCalled();
  });
});
