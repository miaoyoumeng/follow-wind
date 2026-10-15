import { describe, it, expect } from 'vitest';
import { validateFeatureFormat } from '../../src/story';

describe('validateFeatureFormat', () => {
  it('合法结构返回空错误列表', () => {
    expect(validateFeatureFormat({ 用户管理: ['今日用户', '用户列表'] })).toEqual([]);
  });

  it('空对象合法', () => {
    expect(validateFeatureFormat({})).toEqual([]);
  });

  it('顶层是数组时报错并指出实际类型', () => {
    const errors = validateFeatureFormat(['今日用户']);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('顶层应为对象');
    expect(errors[0]).toContain('数组');
  });

  it('顶层是标量时报错并指出实际类型', () => {
    const errors = validateFeatureFormat(123);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('顶层应为对象');
    expect(errors[0]).toContain('数字');
  });

  it('值为非数组时报错并标出键名', () => {
    const errors = validateFeatureFormat({ 用户管理: '今日用户' });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('「用户管理」的值应为数组');
    expect(errors[0]).toContain('字符串');
  });

  it('数组项非字符串时报错并给出一基序号', () => {
    const errors = validateFeatureFormat({ 用户管理: ['今日用户', 123] });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('「用户管理」的第 2 项应为字符串');
    expect(errors[0]).toContain('数字');
  });

  it('null 值报错时描述为空值', () => {
    const errors = validateFeatureFormat({ 用户管理: null });

    expect(errors[0]).toContain('空值');
  });

  it('收集全部错误而非遇到首个即停止', () => {
    const errors = validateFeatureFormat({ 用户管理: 1, 订单管理: [true] });

    expect(errors).toHaveLength(2);
  });
});
