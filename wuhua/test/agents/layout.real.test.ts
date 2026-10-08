import { describe, it, expect } from 'vitest';
import { isValidPanePosition } from '../../src/config/yaml/writer';

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

  it('top 是合法值', () => {
    expect(isValidPanePosition('top')).toBe(true);
  });

  it('bottom 是合法值', () => {
    expect(isValidPanePosition('bottom')).toBe(true);
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
