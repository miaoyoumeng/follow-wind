import { describe, it, expect } from 'vitest';
import { walkFeature } from '../../src/story';

describe('walkFeature', () => {
  it('顶层字符串数组展开为「键-值」路径', () => {
    expect(walkFeature({ 用户管理: ['今日用户', '用户列表'] })).toEqual(['用户管理-今日用户', '用户管理-用户列表']);
  });

  it('多键路径顺序与对象书写顺序一致', () => {
    expect(walkFeature({ 用户管理: ['今日用户'], 订单管理: ['待付款'] })).toEqual([
      '用户管理-今日用户',
      '订单管理-待付款'
    ]);
  });

  it('嵌套对象递归拼接路径', () => {
    expect(walkFeature({ 订单: { 列表: ['待付款'] } })).toEqual(['订单-列表-待付款']);
  });

  it('空数组自身作为叶子', () => {
    expect(walkFeature({ 空主题: [] })).toEqual(['空主题']);
  });

  it('空对象自身作为叶子', () => {
    expect(walkFeature({ 空主题: {} })).toEqual(['空主题']);
  });

  it('数组元素是对象时用下标定位，标量值不作为路径片段', () => {
    expect(walkFeature({ 主题: [{ 子项: '明细' }] })).toEqual(['主题-0-子项']);
  });

  it('数组元素是数字时转为字符串片段', () => {
    expect(walkFeature({ 步骤: [1] })).toEqual(['步骤-1']);
  });

  it('顶层是标量时无可用的名称片段，返回空列表', () => {
    expect(walkFeature('裸字符串')).toEqual([]);
  });

  it('顶层是空对象时返回空列表', () => {
    expect(walkFeature({})).toEqual([]);
  });
});
