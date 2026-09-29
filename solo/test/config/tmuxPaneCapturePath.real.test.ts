import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { getTmuxPaneCapturePath, CAPTURE_DIR } from '../../src/config';

describe('getTmuxPaneCapturePath', () => {
  it('返回 ${CAPTURE_DIR}/${win}-${paneIndex}.md 格式的路径', () => {
    expect(getTmuxPaneCapturePath('win', 0)).toBe(join(CAPTURE_DIR, 'win-0.md'));
  });

  it('不同参数返回不同路径', () => {
    const a = getTmuxPaneCapturePath('win', 0);
    const b = getTmuxPaneCapturePath('win', 1);
    const c = getTmuxPaneCapturePath('other', 0);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(a).toContain('win-0.md');
    expect(b).toContain('win-1.md');
    expect(c).toContain('other-0.md');
  });
});
