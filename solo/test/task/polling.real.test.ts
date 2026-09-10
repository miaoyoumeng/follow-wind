import { describe, it, expect } from 'vitest';
import { compareWithStored } from '../../src/task/polling';

describe('compareWithStored', () => {
  it('storedContent 为 null 时返回 true（无基线）', () => {
    expect(compareWithStored('hello', null)).toBe(true);
  });

  it('内容一致时返回 false', () => {
    expect(compareWithStored('same content', 'same content')).toBe(false);
  });

  it('内容不一致时返回 true', () => {
    expect(compareWithStored('new content', 'old content')).toBe(true);
  });
});
