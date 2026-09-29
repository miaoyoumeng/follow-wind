import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

import { parsePanes } from '../../../src/config/yaml/writer';
import { getAgentPanesLayout } from '../../../src/laytouts/layouts';

describe('One 布局配置解析', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('layout: one 应被正确解析并匹配到 One 布局', () => {
    const rawPanes = {
      claude: {
        layout: 'one',
        booter: 'claude --dangerously-skip-permissions'
      }
    };

    const panes = parsePanes(rawPanes);
    expect(panes).toBeDefined();
    expect(panes?.claude).toBeDefined();
    expect(panes?.claude?.layout).toBe('one');

    const layout = getAgentPanesLayout(panes!);
    expect(layout).toBe('One');
  });
});
