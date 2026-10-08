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
      panes: { claude: { layout: 'left' }, shell: { layout: 'right' } }
    },
    'act-false': {
      workspace: '/off',
      activate: false
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
