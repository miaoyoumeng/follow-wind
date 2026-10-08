import { describe, it, expect } from 'vitest';

import { buildPaneKey } from '../../src/tmux/key';

describe('buildPaneKey', () => {
  it('拼接 session/window/paneIndex 为坐标 key', () => {
    expect(buildPaneKey('sess', 'win', 3)).toBe('sess:win.3');
  });

  it('window 名含特殊字符时原样保留', () => {
    expect(buildPaneKey('sess', 'win-1_b', 0)).toBe('sess:win-1_b.0');
  });
});
