import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readConfig, type WuhuaConfig } from '../../src/config';
import { getAgents, getAgent } from '../../src/agents/manager';

// 文件 IO 是最低层外部依赖，mock 读取函数以隔离 manager 逻辑
vi.mock('../../src/config', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn()
}));

const mockReadConfig = vi.mocked(readConfig);

// 新语义：key = tag 名，value = { layout: 位置 }
const sampleConfig: WuhuaConfig = {
  name: 'l2yzf501k6yxyde',
  agents: {
    'admin-pm': {
      workspace: '/tmp',
      panes: { claude: { layout: 'left' }, shell: { layout: 'right-bottom' } }
    },
    'javaer-item': {
      workspace: '/aasdfadsf'
    },
    'pm-only-claude': {
      workspace: '/pm',
      panes: { claude: { layout: 'left' } }
    },
    'act-true': {
      workspace: '/act',
      activate: true,
      waitTime: 30,
      panes: { claude: { layout: 'left' }, shell: { layout: 'right' } }
    },
    'act-false': {
      workspace: '/off',
      activate: false
    },
    'pm-with-role': {
      workspace: '/pm-role',
      role: { name: '产品经理', chat: { model: 'yuanbao' } },
      product: { name: '后台管理系统', story: { as: '后台管理员', min: 2, max: 5 } }
    }
  }
};

describe('getAgents activate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadConfig.mockReturnValue(sampleConfig);
  });

  it('activate: true 的 agent 返回 activate true', () => {
    expect(getAgent('act-true')?.activate).toBe(true);
  });

  it('activate: false 的 agent 返回 activate false', () => {
    expect(getAgent('act-false')?.activate).toBe(false);
  });

  it('未配置 activate 的 agent 视为 false', () => {
    const agents = getAgents();
    expect(agents.find(a => a.name === 'admin-pm')?.activate).toBe(false);
    expect(agents.find(a => a.name === 'javaer-item')?.activate).toBe(false);
  });
});

describe('getAgents waitTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadConfig.mockReturnValue(sampleConfig);
  });

  it('配置了 waitTime 的 agent 透传该值', () => {
    expect(getAgent('act-true')?.waitTime).toBe(30);
    expect(getAgents().find(a => a.name === 'act-true')?.waitTime).toBe(30);
  });

  it('未配置 waitTime 时为 undefined，由调用方回退默认值', () => {
    expect(getAgent('admin-pm')?.waitTime).toBeUndefined();
    expect(getAgents().find(a => a.name === 'admin-pm')?.waitTime).toBeUndefined();
  });
});

describe('getAgents role/product', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadConfig.mockReturnValue(sampleConfig);
  });

  it('getAgent 透传 agent 配置的 role 与 product', () => {
    const agent = getAgent('pm-with-role');
    expect(agent?.role).toEqual({ name: '产品经理', chat: { model: 'yuanbao' } });
    expect(agent?.product).toEqual({
      name: '后台管理系统',
      story: { as: '后台管理员', min: 2, max: 5 }
    });
  });

  it('getAgents 同样透传 role 与 product', () => {
    const agent = getAgents().find(a => a.name === 'pm-with-role');
    expect(agent?.role?.name).toBe('产品经理');
    expect(agent?.product?.name).toBe('后台管理系统');
  });

  it('未配置 role/product 的 agent 为 undefined', () => {
    expect(getAgent('admin-pm')?.role).toBeUndefined();
    expect(getAgent('admin-pm')?.product).toBeUndefined();
  });
});
