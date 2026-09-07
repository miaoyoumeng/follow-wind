import { describe, it, expect } from 'vitest';
import { resolveSplitAxis, resolveSplitPlan } from '../../../src/core/agents/layout';
import { isValidPanePosition } from '../../../src/core/yaml';
import type { AgentPanes } from '../../../src/core/yaml';

describe('isValidPanePosition', () => {
  it('left 是合法值', () => {
    expect(isValidPanePosition('left')).toBe(true);
  });

  it('right 是合法值', () => {
    expect(isValidPanePosition('right')).toBe(true);
  });

  it('left-top 是合法值', () => {
    expect(isValidPanePosition('left-top')).toBe(true);
  });

  it('right-top 是合法值', () => {
    expect(isValidPanePosition('right-top')).toBe(true);
  });

  it('left-bottom 是合法值', () => {
    expect(isValidPanePosition('left-bottom')).toBe(true);
  });

  it('right-bottom 是合法值', () => {
    expect(isValidPanePosition('right-bottom')).toBe(true);
  });

  it('top 不是合法值（已移除）', () => {
    expect(isValidPanePosition('top')).toBe(false);
  });

  it('bottom 不是合法值（已移除）', () => {
    expect(isValidPanePosition('bottom')).toBe(false);
  });

  it('diagonal 不是合法值', () => {
    expect(isValidPanePosition('diagonal')).toBe(false);
  });

  it('bottom-left 不是合法值（顺序错误）', () => {
    expect(isValidPanePosition('bottom-left')).toBe(false);
  });

  it('top-right 不是合法值（顺序错误）', () => {
    expect(isValidPanePosition('top-right')).toBe(false);
  });

  it('空字符串不是合法值', () => {
    expect(isValidPanePosition('')).toBe(false);
  });
});

describe('resolveSplitAxis', () => {
  it('left + right → 水平 h', () => {
    const panes: AgentPanes = { left: 'claude', right: 'shell' };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('right + left → 水平 h', () => {
    const panes: AgentPanes = { right: 'claude', left: 'shell' };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('left-top + right-top → 水平 h（同行）', () => {
    const panes: AgentPanes = { 'left-top': 'claude', 'right-top': 'shell' };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('left-bottom + right-bottom → 水平 h（同行）', () => {
    const panes: AgentPanes = { 'left-bottom': 'claude', 'right-bottom': 'shell' };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('left-top + left-bottom → 垂直 v（同列）', () => {
    const panes: AgentPanes = { 'left-top': 'claude', 'left-bottom': 'shell' };
    expect(resolveSplitAxis(panes)).toBe('v');
  });

  it('right-top + right-bottom → 垂直 v（同列）', () => {
    const panes: AgentPanes = { 'right-top': 'claude', 'right-bottom': 'shell' };
    expect(resolveSplitAxis(panes)).toBe('v');
  });

  it('left-top + right-bottom → null（对角线不支持）', () => {
    const panes: AgentPanes = { 'left-top': 'claude', 'right-bottom': 'shell' };
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('left-bottom + right-top → null（对角线不支持）', () => {
    const panes: AgentPanes = { 'left-bottom': 'claude', 'right-top': 'shell' };
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('left + left-top → null（混合不匹配）', () => {
    const panes = { left: 'claude', 'left-top': 'shell' } as unknown as AgentPanes;
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('非法位置 key → null', () => {
    const panes = { top: 'claude', bottom: 'shell' } as unknown as AgentPanes;
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('空 panes → null', () => {
    expect(resolveSplitAxis({})).toBeNull();
  });

  it('undefined panes → null', () => {
    expect(resolveSplitAxis(undefined)).toBeNull();
  });

  it('单 key left → h', () => {
    expect(resolveSplitAxis({ left: 'claude' })).toBe('h');
  });

  it('单 key left-top → null（需要至少 2 个才能判定方向）', () => {
    expect(resolveSplitAxis({ 'left-top': 'claude' })).toBeNull();
  });
});

describe('resolveSplitPlan', () => {
  it('3 panes: left + right-top + right-bottom → 模式 A', () => {
    const plan = resolveSplitPlan({
      left: 'claude',
      'right-top': 'shell',
      'right-bottom': 'git'
    });
    expect(plan).toEqual({
      pattern: 'left-split',
      steps: [
        { orientation: '-h', target: 'original' },
        { orientation: '-v', target: 'right' }
      ],
      paneMap: { left: 1, 'right-top': 2, 'right-bottom': 3 }
    });
  });

  it('3 panes: right + left-top + left-bottom → 模式 B', () => {
    const plan = resolveSplitPlan({
      right: 'claude',
      'left-top': 'shell',
      'left-bottom': 'git'
    });
    expect(plan).toEqual({
      pattern: 'right-split',
      steps: [
        { orientation: '-h', target: 'original' },
        { orientation: '-v', target: 'left' }
      ],
      paneMap: { 'left-top': 1, right: 2, 'left-bottom': 3 }
    });
  });

  it('3 panes: left + right-top + left-bottom → null（无效组合）', () => {
    expect(
      resolveSplitPlan({
        left: 'claude',
        'right-top': 'shell',
        'left-bottom': 'git'
      })
    ).toBeNull();
  });

  it('3 panes: right + right-top + left-bottom → null（无效组合）', () => {
    expect(
      resolveSplitPlan({
        right: 'claude',
        'right-top': 'shell',
        'left-bottom': 'git'
      })
    ).toBeNull();
  });

  it('2 panes: left + right → null（2 pane 用 resolveSplitAxis，不走 plan）', () => {
    expect(resolveSplitPlan({ left: 'claude', right: 'shell' })).toBeNull();
  });

  it('4+ panes → null（不支持）', () => {
    expect(
      resolveSplitPlan({
        'left-top': 'a',
        'right-top': 'b',
        'left-bottom': 'c',
        'right-bottom': 'd'
      })
    ).toBeNull();
  });

  it('undefined → null', () => {
    expect(resolveSplitPlan(undefined)).toBeNull();
  });

  it('空 → null', () => {
    expect(resolveSplitPlan({})).toBeNull();
  });
});
