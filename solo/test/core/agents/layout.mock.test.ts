import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { panesLayout } from '../../../src/core/agents/layout';
import { splitPane, setPaneTitle, sendKeys } from '../../../src/tmux';

// tmux 命令是外部依赖，mock 以隔离布局编排逻辑
vi.mock('../../../src/tmux', () => ({
  splitPane: vi.fn().mockResolvedValue(2),
  setPaneTitle: vi.fn().mockResolvedValue(undefined),
  sendKeys: vi.fn().mockResolvedValue(undefined)
}));

const mockSplitPane = vi.mocked(splitPane);
const mockSetPaneTitle = vi.mocked(setPaneTitle);
const mockSendKeys = vi.mocked(sendKeys);

describe('panesLayout', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockSplitPane.mockClear();
    mockSetPaneTitle.mockClear();
    mockSendKeys.mockClear();
    mockSplitPane.mockResolvedValue(2);
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('1-pane：不 split，设置标题', async () => {
    await panesLayout('sess', 'win', { claude: { layout: 'left' } }, null, null, 1, '/tmp');
    expect(mockSplitPane).not.toHaveBeenCalled();
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 1, 'claude');
  });

  it('2-pane horizontal：一次 -h split，设置两个标题', async () => {
    await panesLayout('sess', 'win', { claude: { layout: 'left' }, shell: { layout: 'right' } }, null, 'h', 1, '/tmp');
    expect(mockSplitPane).toHaveBeenCalledWith('sess', 'win', 1, '-h', '/tmp');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 1, 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 2, 'shell');
  });

  it('2-pane vertical：一次 -v split，设置两个标题', async () => {
    await panesLayout(
      'sess',
      'win',
      { claude: { layout: 'left-top' }, shell: { layout: 'left-bottom' } },
      null,
      'v',
      1,
      '/tmp'
    );
    expect(mockSplitPane).toHaveBeenCalledWith('sess', 'win', 1, '-v', '/tmp');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 1, 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 2, 'shell');
  });

  it('3-pane left-split：两次 split，设置三个标题', async () => {
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
      { claude: { layout: 'left' }, shell: { layout: 'right-top' }, git: { layout: 'right-bottom' } },
      plan,
      null,
      1,
      '/tmp'
    );
    expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess', 'win', 1, '-h', '/tmp');
    expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess', 'win', 2, '-v', '/tmp');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 1, 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 2, 'shell');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 3, 'git');
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
      { claude: { layout: 'right' }, shell: { layout: 'left-top' }, git: { layout: 'left-bottom' } },
      plan,
      null,
      1,
      '/tmp'
    );
    expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess', 'win', 1, '-h', '/tmp');
    expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess', 'win', 1, '-v', '/tmp');
    // config 顺序：claude(#0), shell(#1), git(#2)
    // posToIdx keys 顺序：left-top, left-bottom, right
    // claude(#0) → left-top → tmux 1; shell(#1) → left-bottom → tmux 3; git(#2) → right → tmux 2
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 1, 'claude');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 3, 'shell');
    expect(mockSetPaneTitle).toHaveBeenCalledWith('sess', 'win', 2, 'git');
  });

  it('booter 有值时，调用 sendKeys 发送 booter 命令 + Enter', async () => {
    await panesLayout('sess', 'win', { left: { layout: 'left', booter: 'claude' } }, null, null, 1, '/tmp');
    expect(mockSendKeys).toHaveBeenCalledWith('sess', 'win', 1, 'claude');
    expect(mockSendKeys).toHaveBeenCalledWith('sess', 'win', 1, 'Enter');
  });

  it('booter 无值时，不调用 sendKeys', async () => {
    await panesLayout('sess', 'win', { left: { layout: 'left' } }, null, null, 1, '/tmp');
    expect(mockSendKeys).not.toHaveBeenCalled();
  });

  it('多个 pane，只对 booter 有值的 pane 调用 sendKeys', async () => {
    await panesLayout(
      'sess',
      'win',
      { left: { layout: 'left', booter: 'claude' }, right: { layout: 'right' } },
      null,
      'h',
      1,
      '/tmp'
    );
    expect(mockSendKeys).toHaveBeenCalledWith('sess', 'win', 1, 'claude');
    expect(mockSendKeys).toHaveBeenCalledWith('sess', 'win', 1, 'Enter');
    expect(mockSendKeys).toHaveBeenCalledTimes(2);
  });
});
