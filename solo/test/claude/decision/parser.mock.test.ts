import { describe, it, expect } from 'vitest';

import { NUMBERED_LINE_REGEX, extractNumberedLines, isContinuousFromOne } from '../../../src/claude/decision/parser';

describe('NUMBERED_LINE_REGEX', () => {
  it('匹配带 /m 的多行内容中第二行的编号', () => {
    expect(NUMBERED_LINE_REGEX.test('no match here\n2. second line')).toBe(true);
  });
});

describe('extractNumberedLines', () => {
  it('提取多行内容中的所有编号行', () => {
    const result = extractNumberedLines('1. first\n2. second');
    expect(result).toEqual([
      { num: 1, line: '1. first' },
      { num: 2, line: '2. second' }
    ]);
  });

  it('识别 ❯ 前缀的编号行', () => {
    const result = extractNumberedLines('❯ 3. option');
    expect(result).toEqual([{ num: 3, line: '❯ 3. option' }]);
  });

  it('无编号行时返回空数组', () => {
    expect(extractNumberedLines('no numbers here')).toEqual([]);
  });
});

describe('isContinuousFromOne', () => {
  it('空数组返回 false', () => {
    expect(isContinuousFromOne([])).toBe(false);
  });

  it('首项非 1 返回 false', () => {
    expect(isContinuousFromOne([2, 3])).toBe(false);
  });

  it('从 1 开始的连续序列返回 true', () => {
    expect(isContinuousFromOne([1, 2, 3])).toBe(true);
  });

  it('有跳跃的序列返回 false', () => {
    expect(isContinuousFromOne([1, 3])).toBe(false);
  });
});
