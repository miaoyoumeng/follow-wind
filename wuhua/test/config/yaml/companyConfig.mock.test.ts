import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn()
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: mockReadFileSync,
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

import { readConfig, resolveCompanyConfig } from '../../../src/config';

describe('resolveCompanyConfig 默认值', () => {
  it('完整配置时原样返回', () => {
    const resolved = resolveCompanyConfig({
      role: { name: '产品经理', chat: { model: 'yuanbao' } },
      product: { name: '后台管理系统', story: { as: '后台管理员', min: 2, max: 5 } },
      description: '公司人数不超过5人'
    });

    expect(resolved).toEqual({
      role: { name: '产品经理', chat: { model: 'yuanbao' } },
      product: { name: '后台管理系统', story: { as: '后台管理员', min: 2, max: 5 } },
      description: '公司人数不超过5人'
    });
  });

  it('未配置时 role.chat.model 默认 deepseek，story 数量默认 2 ~ 3，其余为空字符串', () => {
    expect(resolveCompanyConfig(undefined)).toEqual({
      role: { name: '', chat: { model: 'deepseek' } },
      product: { name: '', story: { as: '', min: 2, max: 3 } },
      description: ''
    });
  });

  it('null 与 undefined 行为一致', () => {
    expect(resolveCompanyConfig(null)).toEqual(resolveCompanyConfig(undefined));
  });

  it('只配置 story.as 时，其余字段取默认值', () => {
    const resolved = resolveCompanyConfig({ product: { story: { as: '后台管理员' } } });

    expect(resolved.product).toEqual({ name: '', story: { as: '后台管理员', min: 2, max: 3 } });
    expect(resolved.role.name).toBe('');
  });

  it('只配置 story.max 时，min 取默认值 2', () => {
    const resolved = resolveCompanyConfig({ product: { story: { max: 8 } } });

    expect(resolved.product.story).toEqual({ as: '', min: 2, max: 8 });
  });

  it('min 大于 max 时，max 抬升到 min', () => {
    const resolved = resolveCompanyConfig({ product: { story: { min: 5, max: 2 } } });

    expect(resolved.product.story).toEqual({ as: '', min: 5, max: 5 });
  });

  it('只配置 role.chat.model 时，product 全取默认值', () => {
    const resolved = resolveCompanyConfig({ role: { chat: { model: 'gpt' } } });

    expect(resolved.role.chat.model).toBe('gpt');
    expect(resolved.role.name).toBe('');
    expect(resolved.product.story).toEqual({ as: '', min: 2, max: 3 });
  });
});

describe('readConfig company 段解析', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
  });

  it('解析 company 段的全部字段', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
company:
  role:
    name: '产品经理'
    chat:
      model: 'yuanbao'
  product:
    name: '后台管理系统'
    story:
      as: '后台管理员'
      min: 2
      max: 5
  description: '公司人数不超过5人'
`);

    expect(readConfig().company).toEqual({
      role: { name: '产品经理', chat: { model: 'yuanbao' } },
      product: { name: '后台管理系统', story: { as: '后台管理员', min: 2, max: 5 } },
      description: '公司人数不超过5人'
    });
  });

  // 以下「丢弃」用例同时断言 name 被正常解析，以区分「解析器正确丢弃」与「解析器根本没运行」
  it('未配置 company 段时为 undefined', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
`);

    const config = readConfig();
    expect(config.name).toBe('sess-abc');
    expect(config.company).toBeUndefined();
  });

  it('非字符串或非数字字段被丢弃，其余字段保留', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
company:
  role:
    name: 123
  product:
    story:
      as: '后台管理员'
      min: 'not-a-number'
`);

    expect(readConfig().company).toEqual({ product: { story: { as: '后台管理员' } } });
  });

  it('全部字段非法时整段丢弃', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
company:
  description: 123
`);

    const config = readConfig();
    expect(config.name).toBe('sess-abc');
    expect(config.company).toBeUndefined();
  });

  it('company 段不是对象时丢弃', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
company: 'not-an-object'
`);

    const config = readConfig();
    expect(config.name).toBe('sess-abc');
    expect(config.company).toBeUndefined();
  });

  it('role 段不是对象时丢弃 role，保留同级字段', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
company:
  role: 'not-an-object'
  description: '公司人数不超过5人'
`);

    expect(readConfig().company).toEqual({ description: '公司人数不超过5人' });
  });

  it('story 段不是对象时丢弃 story，保留 product 其他字段', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
company:
  product:
    name: '后台管理系统'
    story: 'not-an-object'
`);

    expect(readConfig().company).toEqual({ product: { name: '后台管理系统' } });
  });
});
