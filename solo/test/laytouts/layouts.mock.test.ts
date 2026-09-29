import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgentPanesLayout } from '../../src/laytouts/layouts';
import type { AgentPanes } from '../../src/config';

vi.mock('../../src/logging', () => ({
  logger: { info: vi.fn(), debug: vi.fn() }
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
