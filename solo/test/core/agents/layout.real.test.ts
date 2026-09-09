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
    const panes: AgentPanes = { claude: { layout: 'left' }, shell: { layout: 'right' } };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('right + left → 水平 h', () => {
    const panes: AgentPanes = { claude: { layout: 'right' }, shell: { layout: 'left' } };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('left-top + right-top → 水平 h（同行）', () => {
    const panes: AgentPanes = { claude: { layout: 'left-top' }, shell: { layout: 'right-top' } };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('left-bottom + right-bottom → 水平 h（同行）', () => {
    const panes: AgentPanes = { claude: { layout: 'left-bottom' }, shell: { layout: 'right-bottom' } };
    expect(resolveSplitAxis(panes)).toBe('h');
  });

  it('left-top + left-bottom → 垂直 v（同列）', () => {
    const panes: AgentPanes = { claude: { layout: 'left-top' }, shell: { layout: 'left-bottom' } };
    expect(resolveSplitAxis(panes)).toBe('v');
  });

  it('right-top + right-bottom → 垂直 v（同列）', () => {
    const panes: AgentPanes = { claude: { layout: 'right-top' }, shell: { layout: 'right-bottom' } };
    expect(resolveSplitAxis(panes)).toBe('v');
  });

  it('left-top + right-bottom → null（对角线不支持）', () => {
    const panes: AgentPanes = { claude: { layout: 'left-top' }, shell: { layout: 'right-bottom' } };
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('left-bottom + right-top → null（对角线不支持）', () => {
    const panes: AgentPanes = { claude: { layout: 'left-bottom' }, shell: { layout: 'right-top' } };
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('left + left-top → null（混合不匹配）', () => {
    const panes: AgentPanes = { claude: { layout: 'left' }, shell: { layout: 'left-top' } };
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('非法 layout 值 → null', () => {
    const panes = { claude: { layout: 'top' }, shell: { layout: 'bottom' } } as unknown as AgentPanes;
    expect(resolveSplitAxis(panes)).toBeNull();
  });

  it('空 panes → null', () => {
    expect(resolveSplitAxis({})).toBeNull();
  });

  it('undefined panes → null', () => {
    expect(resolveSplitAxis(undefined)).toBeNull();
  });

  it('单 tag left → h', () => {
    expect(resolveSplitAxis({ claude: { layout: 'left' } })).toBe('h');
  });

  it('单 tag left-top → null（需要至少 2 个才能判定方向）', () => {
    expect(resolveSplitAxis({ claude: { layout: 'left-top' } })).toBeNull();
  });
});

describe('resolveSplitPlan', () => {
  it('3 panes: left + right-top + right-bottom → 模式 A', () => {
    const plan = resolveSplitPlan({
      claude: { layout: 'left' },
      shell: { layout: 'right-top' },
      git: { layout: 'right-bottom' }
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
      claude: { layout: 'right' },
      shell: { layout: 'left-top' },
      git: { layout: 'left-bottom' }
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
        claude: { layout: 'left' },
        shell: { layout: 'right-top' },
        git: { layout: 'left-bottom' }
      })
    ).toBeNull();
  });

  it('3 panes: right + right-top + left-bottom → null（无效组合）', () => {
    expect(
      resolveSplitPlan({
        claude: { layout: 'right' },
        shell: { layout: 'right-top' },
        git: { layout: 'left-bottom' }
      })
    ).toBeNull();
  });

  it('2 panes: left + right → null（2 pane 用 resolveSplitAxis，不走 plan）', () => {
    expect(resolveSplitPlan({ claude: { layout: 'left' }, shell: { layout: 'right' } })).toBeNull();
  });

  it('4+ panes → null（不支持）', () => {
    expect(
      resolveSplitPlan({
        a: { layout: 'left-top' },
        b: { layout: 'right-top' },
        c: { layout: 'left-bottom' },
        d: { layout: 'right-bottom' }
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
