import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgentPanesLayout, applyTwoPaneSplit, applyThreePaneSplit } from '../../src/laytouts/layouts';
import type { AgentPanes } from '../../src/config';
import { splitPane } from '../../src/tmux';

vi.mock('../../src/logging', () => ({
  logger: { info: vi.fn(), debug: vi.fn() }
}));

// tmux 命令封装属外部依赖，mock 以隔离分屏执行逻辑
vi.mock('../../src/tmux', () => ({
  splitPane: vi.fn()
}));

describe('getAgentPanesLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('空 panes 返回 undefined', () => {
    expect(getAgentPanesLayout({})).toBeUndefined();
  });

  it('合法 Vertical 布局返回 Vertical', () => {
    const panes: AgentPanes = { a: { layout: 'left' }, b: { layout: 'right' } };
    expect(getAgentPanesLayout(panes)).toBe('Vertical');
  });

  it('合法 Horizontal 布局返回 Horizontal', () => {
    const panes: AgentPanes = { a: { layout: 'top' }, b: { layout: 'bottom' } };
    expect(getAgentPanesLayout(panes)).toBe('Horizontal');
  });

  it('不合法布局返回 undefined', () => {
    const panes: AgentPanes = { only: { layout: 'left' } };
    expect(getAgentPanesLayout(panes)).toBeUndefined();
  });

  it('合法 One 布局返回 One', () => {
    const panes = { a: { layout: 'one' } } as unknown as AgentPanes;
    expect(getAgentPanesLayout(panes)).toBe('One');
  });

  it('合法 LeftThreePane 布局返回 LeftThreePane', () => {
    const panes = {
      a: { layout: 'left' },
      b: { layout: 'right-top' },
      c: { layout: 'right-bottom' }
    } as unknown as AgentPanes;
    expect(getAgentPanesLayout(panes)).toBe('LeftThreePane');
  });

  it('合法 RightThreePane 布局返回 RightThreePane', () => {
    const panes = {
      a: { layout: 'right' },
      b: { layout: 'left-top' },
      c: { layout: 'left-bottom' }
    } as unknown as AgentPanes;
    expect(getAgentPanesLayout(panes)).toBe('RightThreePane');
  });
});

describe('pane 分屏执行', () => {
  const mockSplitPane = vi.mocked(splitPane);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applyTwoPaneSplit 以 -h 分屏并按 left/right 排序表返回映射', async () => {
    mockSplitPane.mockResolvedValueOnce(5);
    const entries: [string, { layout: string; booter?: string }][] = [
      ['a', { layout: 'left' }],
      ['b', { layout: 'right' }]
    ];
    const result = await applyTwoPaneSplit('sess', 'win', entries, 1, '/dir', '-h', { left: 0, right: 1 });
    expect(mockSplitPane).toHaveBeenCalledWith('sess', 'win', 1, '-h', '/dir');
    expect(result).toEqual({ left: 1, right: 5 });
  });

  it('applyTwoPaneSplit 返回映射与 entries 传入顺序无关', async () => {
    mockSplitPane.mockResolvedValueOnce(5);
    const entries: [string, { layout: string; booter?: string }][] = [
      ['b', { layout: 'right' }],
      ['a', { layout: 'left' }]
    ];
    const result = await applyTwoPaneSplit('sess', 'win', entries, 1, '/dir', '-h', { left: 0, right: 1 });
    expect(result).toEqual({ left: 1, right: 5 });
  });

  it('applyTwoPaneSplit 以 -v 分屏并按 top/bottom 排序表返回映射', async () => {
    mockSplitPane.mockResolvedValueOnce(7);
    const entries: [string, { layout: string; booter?: string }][] = [
      ['a', { layout: 'top' }],
      ['b', { layout: 'bottom' }]
    ];
    const result = await applyTwoPaneSplit('sess', 'win', entries, 1, '/dir', '-v', { top: 0, bottom: 1 });
    expect(mockSplitPane).toHaveBeenCalledWith('sess', 'win', 1, '-v', '/dir');
    expect(result).toEqual({ top: 1, bottom: 7 });
  });

  it('LeftThreePane 先 -h 于原 pane，再 -v 于新 pane，返回三位置映射', async () => {
    mockSplitPane.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    const result = await applyThreePaneSplit('sess', 'win', 'LeftThreePane', 1, '/dir');
    expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess', 'win', 1, '-h', '/dir');
    expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess', 'win', 2, '-v', '/dir');
    expect(result).toEqual({ left: 1, 'right-top': 2, 'right-bottom': 3 });
  });

  it('RightThreePane 先 -h 于原 pane，再 -v 于原 pane，返回三位置映射', async () => {
    mockSplitPane.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    const result = await applyThreePaneSplit('sess', 'win', 'RightThreePane', 1, '/dir');
    expect(mockSplitPane).toHaveBeenNthCalledWith(1, 'sess', 'win', 1, '-h', '/dir');
    expect(mockSplitPane).toHaveBeenNthCalledWith(2, 'sess', 'win', 1, '-v', '/dir');
    expect(result).toEqual({ 'left-top': 1, 'left-bottom': 3, right: 2 });
  });
});
