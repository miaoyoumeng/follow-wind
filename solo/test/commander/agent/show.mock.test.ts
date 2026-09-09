import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readConfig, type SoloConfig } from '../../../src/core/yaml';
import { runAgentWorkspace, runAgentPanes } from '../../../src/commander/agent/show';

// 文件 IO 是最低层外部依赖，mock 读取函数以隔离查询逻辑
vi.mock('../../../src/core/yaml', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn()
}));

const mockReadConfig = vi.mocked(readConfig);

// 新语义：key = tag 名，value = { layout: 位置 }
const sampleConfig: SoloConfig = {
  name: 'l2yzf501k6yxyde',
  agents: {
    'admin-pm': {
      workspace: '/tmp',
      panes: { claude: { layout: 'left' }, shell: { layout: 'right-bottom' } }
    },
    'javaer-item': {
      workspace: '/aasdfadsf'
    }
  }
};

describe('runAgentWorkspace', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadConfig.mockReturnValue(sampleConfig);
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('存在 agent 时打印其 workspace', () => {
    runAgentWorkspace('admin-pm');
    expect(logs).toEqual(['/tmp']);
  });

  it('agent 不存在时打印错误提示且不打印 workspace', () => {
    runAgentWorkspace('ghost');
    expect(logs.some(l => l.includes('does not exist'))).toBe(true);
    expect(logs).not.toContain('/tmp');
  });
});

describe('runAgentPanes', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadConfig.mockReturnValue(sampleConfig);
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => logs.push(msg));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('存在 panes 时逐行打印 tag: layout', () => {
    runAgentPanes('admin-pm');
    expect(logs).toEqual(['claude: left', 'shell: right-bottom']);
  });

  it('agent 未配置 panes 时打印提示', () => {
    runAgentPanes('javaer-item');
    expect(logs.some(l => l.includes('未配置 panes'))).toBe(true);
  });

  it('agent 不存在时打印错误提示', () => {
    runAgentPanes('ghost');
    expect(logs.some(l => l.includes('does not exist'))).toBe(true);
  });
});
