import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import type * as AgentsModuleType from '../../src/agents';
import type * as ConfigModuleType from '../../src/config';

const {
  mockValidateWorkspace,
  mockReadConfig,
  mockGetAgents,
  mockGetAgent,
  mockExists,
  mockStat,
  mockReadFile,
  mockWriteFile,
  mockEnsureDir,
  mockReadDir,
  mockWuhuaDir
} = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockReadConfig: vi.fn(),
  mockGetAgents: vi.fn(),
  mockGetAgent: vi.fn(),
  mockExists: vi.fn(),
  mockStat: vi.fn(),
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockEnsureDir: vi.fn(),
  mockReadDir: vi.fn(),
  // 与 config 模块的 WUHUA_DIR 同值，供 mock 工厂引用
  // （vi.hoisted 在 import 之前执行，故用模板字符串而非 path.join）
  mockWuhuaDir: `${process.cwd()}/.wuhua`
}));

// status 是工作区校验依赖，mock 以隔离 runStory 的编排逻辑
vi.mock('../../src/cli/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

// agents 是 agent 查找依赖，mock 以隔离配置文件解析
vi.mock('../../src/agents', async importOriginal => {
  const actual = await importOriginal<typeof AgentsModuleType>();
  return { ...actual, getAgents: mockGetAgents, getAgent: mockGetAgent };
});

// readConfig 是 YAML 文件读取边界，getAgentPromptsDir 是路径计算，mock 以隔离；
// resolveCompanyConfig 是纯函数，保留真实实现，以覆盖「配置值如何进入 prompt」
vi.mock('../../src/config', async importOriginal => {
  const actual = await importOriginal<typeof ConfigModuleType>();
  return {
    ...actual,
    readConfig: mockReadConfig,
    getAgentPromptsDir: (agentName: string) => `${mockWuhuaDir}/agents/${agentName}/prompts`
  };
});

// fs 是外部边界，mock 以隔离磁盘读写
vi.mock('../../src/utils/files', () => ({
  exists: mockExists,
  stat: mockStat,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  ensureDir: mockEnsureDir,
  readDir: mockReadDir
}));

import { runStory } from '../../src/cli';

const ROLE = { name: '产品经理', chat: { model: 'yuanbao' } };
const PRODUCT = { name: '后台管理系统', story: { as: '后台管理员', min: 2, max: 3 } };

const CONSOLE_AGENT = { name: 'console', workspace: '/ws/console', activate: true, role: ROLE, product: PRODUCT };
const ALPHA_AGENT = { name: 'alpha', workspace: '/ws/alpha', activate: true, role: ROLE, product: PRODUCT };
const BETA_AGENT = { name: 'beta', workspace: '/ws/beta', activate: false, role: ROLE, product: PRODUCT };

const FEATURE_JSON = JSON.stringify({
  用户管理: ['今日用户', '用户列表'],
  订单管理: ['待付款']
});

/** 某 agent 的 prompts 目录，与 src/config 的 getAgentPromptsDir 同构 */
const promptsDirOf = (agentName: string): string => join(mockWuhuaDir, 'agents', agentName, 'prompts');

/** 写入某个 prompts 目录的全部文件路径 */
const promptWritesUnder = (agentName: string): string[] =>
  mockWriteFile.mock.calls
    .map((call: unknown[]) => call[0] as string)
    .filter((p: string) => p.startsWith(promptsDirOf(agentName)));

/** 本次用例中 console.log 打印的全部行 */
let logged: string[] = [];
const consoleOutput = (): string => logged.join('\n');

/** 断言打印给用户的提示里包含指定文案 */
const expectLogged = (fragment: string): void => {
  expect(consoleOutput()).toContain(fragment);
};

describe('runStory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockValidateWorkspace.mockReturnValue('my-session');
    mockReadConfig.mockReturnValue({ name: 'my-session' });
    mockGetAgent.mockReturnValue(CONSOLE_AGENT);
    mockGetAgents.mockReturnValue([ALPHA_AGENT, BETA_AGENT]);
    mockExists.mockReturnValue(true);
    mockStat.mockReturnValue({ isDirectory: () => false });
    mockReadFile.mockReturnValue(FEATURE_JSON);
    mockReadDir.mockReturnValue([]);

    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  describe('agent 目标解析', () => {
    it('--agent 指定单个 agent 时只处理该 agent', () => {
      runStory('console', 'spec/feature.json');

      expect(mockGetAgent).toHaveBeenCalledWith('console');
      expect(promptWritesUnder('console').length).toBeGreaterThan(0);
      expect(mockGetAgents).not.toHaveBeenCalled();
    });

    it('--agent 指定的 agent 不存在时提示并置退出码 1', () => {
      mockGetAgent.mockReturnValue(undefined);

      runStory('ghost', 'spec/feature.json');

      expectLogged('ghost');
      expectLogged('不存在');
      expect(process.exitCode).toBe(1);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('--agent=all 时处理配置中的全部 agent', () => {
      runStory('all', 'spec/feature.json');

      expect(promptWritesUnder('alpha').length).toBeGreaterThan(0);
      expect(promptWritesUnder('beta').length).toBeGreaterThan(0);
    });

    it('--agent=all 且没有任何 agent 时提示，不生成产物', () => {
      mockGetAgents.mockReturnValue([]);

      runStory('all', 'spec/feature.json');

      expectLogged('没有');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe('--file 路径解析', () => {
    it('相对路径基于 agent 的 workspace 解析', () => {
      runStory('console', 'spec/feature.json');

      expect(mockExists).toHaveBeenCalledWith('/ws/console/spec/feature.json');
    });

    it('绝对路径原样使用，不受 agent workspace 影响', () => {
      runStory('console', '/elsewhere/feature.json');

      expect(mockExists).toHaveBeenCalledWith('/elsewhere/feature.json');
    });

    it('--agent=all 时每个 agent 各自解析相对路径', () => {
      runStory('all', 'spec/feature.json');

      expect(mockExists).toHaveBeenCalledWith('/ws/alpha/spec/feature.json');
      expect(mockExists).toHaveBeenCalledWith('/ws/beta/spec/feature.json');
    });
  });

  describe('feature 文件缺失或不可用', () => {
    it('文件不存在时给出含解析后路径的友好提示，并置退出码 1', () => {
      mockExists.mockReturnValue(false);

      runStory('console', 'spec/feature.json');

      expectLogged('/ws/console/spec/feature.json');
      expect(process.exitCode).toBe(1);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('--agent=all 时单个 agent 缺文件，其余 agent 照常生成', () => {
      mockExists.mockImplementation((p: string) => !p.startsWith('/ws/beta/'));

      runStory('all', 'spec/feature.json');

      expect(promptWritesUnder('alpha').length).toBeGreaterThan(0);
      expect(promptWritesUnder('beta')).toEqual([]);
      expect(process.exitCode).toBe(1);
    });

    it('路径是目录时提示并置退出码 1', () => {
      mockStat.mockReturnValue({ isDirectory: () => true });

      runStory('console', 'spec/feature.json');

      expectLogged('是一个目录');
      expect(process.exitCode).toBe(1);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('文件内容读不到时提示权限问题', () => {
      mockReadFile.mockReturnValue(null);

      runStory('console', 'spec/feature.json');

      expectLogged('没有读取权限');
      expect(process.exitCode).toBe(1);
    });

    it('内容不是合法 JSON 时提示', () => {
      mockReadFile.mockReturnValue('{ 不是 json');

      runStory('console', 'spec/feature.json');

      expectLogged('不是合法的 JSON');
      expect(process.exitCode).toBe(1);
    });

    it('格式不符合标准时提示并列出问题', () => {
      mockReadFile.mockReturnValue(JSON.stringify({ 用户管理: '今日用户', 订单管理: [1] }));

      runStory('console', 'spec/feature.json');

      expectLogged('格式不符合标准');
      expectLogged('「用户管理」');
      expect(process.exitCode).toBe(1);
    });
  });

  describe('agent 缺少 role/product 配置', () => {
    const cases: Array<{ field: string; agent: AgentsModuleType.Agent }> = [
      { field: 'agents.console.role.name', agent: { ...CONSOLE_AGENT, role: undefined } },
      { field: 'agents.console.product.name', agent: { ...CONSOLE_AGENT, product: undefined } },
      {
        field: 'agents.console.product.story.as',
        agent: { ...CONSOLE_AGENT, product: { name: '后台管理系统', story: { min: 2, max: 3 } } }
      }
    ];

    it.each(cases)('$field 缺失时提示该字段并置退出码 1，不生成产物', ({ field, agent }) => {
      mockGetAgent.mockReturnValue(agent);

      runStory('console', 'spec/feature.json');

      expectLogged(field);
      expect(process.exitCode).toBe(1);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('role 与 product 全部缺失时一次列出全部字段', () => {
      mockGetAgent.mockReturnValue({ ...CONSOLE_AGENT, role: undefined, product: undefined });

      runStory('console', 'spec/feature.json');

      expectLogged('agents.console.role.name');
      expectLogged('agents.console.product.name');
      expectLogged('agents.console.product.story.as');
      expect(process.exitCode).toBe(1);
    });
  });

  describe('prompt 产物', () => {
    it('prompt 写入 <cwd>/.wuhua/agents/<agent>/prompts/，命名规则不变', () => {
      runStory('console', 'spec/feature.json');

      const topics = promptWritesUnder('console')
        .map((p: string) => p.slice(promptsDirOf('console').length + 1))
        .filter((name: string) => name !== 'index.md');
      // sort() 默认按 UTF-16 码点排序：用（U+7528）在 订（U+8BA2）之前
      expect(topics.sort()).toEqual([
        'story-用户管理-今日用户.md',
        'story-用户管理-用户列表.md',
        'story-订单管理-待付款.md'
      ]);
    });

    it('完成后在同一个 prompts 目录重建 index.md', () => {
      runStory('console', 'spec/feature.json');

      const indexWrites = mockWriteFile.mock.calls.filter(
        (call: unknown[]) => call[0] === join(promptsDirOf('console'), 'index.md')
      );
      expect(indexWrites).toHaveLength(1);
    });

    it('feature 内容为空对象时仍重建索引', () => {
      mockReadFile.mockReturnValue(JSON.stringify({}));

      runStory('console', 'spec/feature.json');

      const indexWrites = mockWriteFile.mock.calls.filter(
        (call: unknown[]) => call[0] === join(promptsDirOf('console'), 'index.md')
      );
      expect(indexWrites).toHaveLength(1);
    });

    it('在 feature 文件同级只创建 story 输出目录，不创建 prd 目录', () => {
      runStory('console', 'spec/feature.json');

      expect(mockEnsureDir).toHaveBeenCalledWith('/ws/console/spec/story');
      expect(mockEnsureDir).not.toHaveBeenCalledWith('/ws/console/spec/prd');
    });

    it('为每个叶子主题创建 story 目录，且不写 prd 文件', () => {
      runStory('console', 'spec/feature.json');

      expect(mockEnsureDir).toHaveBeenCalledWith('/ws/console/spec/story/用户管理-用户列表');
      const prdWrites = mockWriteFile.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('/prd/')
      );
      expect(prdWrites).toHaveLength(0);
    });

    it('生成的 prompt 使用配置中的 chat.model 与产品信息', () => {
      runStory('console', 'spec/feature.json');

      const promptContent = mockWriteFile.mock.calls
        .map((call: unknown[]) => call[1] as string)
        .find((content: string) => content.startsWith('/sunny:commander-story'));
      expect(promptContent).toContain('/sunny:commander-story yuanbao');
      expect(promptContent).toContain('您的工作是`产品经理`');
      expect(promptContent).toContain('系统产品`后台管理系统`');
      expect(promptContent).toContain('扮演为`后台管理员`角色');
    });

    it('生成的 prompt 条数由该 agent 的 product.story min / max 决定', () => {
      mockGetAgent.mockReturnValue({
        ...CONSOLE_AGENT,
        product: { name: '后台管理系统', story: { as: '后台管理员', min: 4, max: 4 } }
      });

      runStory('console', 'spec/feature.json');

      const promptContent = mockWriteFile.mock.calls
        .map((call: unknown[]) => call[1] as string)
        .find((content: string) => content.startsWith('/sunny:commander-story'));
      expect(promptContent?.match(/--prompt="/g)).toHaveLength(4);
    });

    it('--agent=all 时每个 agent 使用各自 agent 段下的 role / product', () => {
      mockGetAgents.mockReturnValue([
        { ...ALPHA_AGENT, role: { name: '甲', chat: { model: 'model-a' } } },
        { ...BETA_AGENT, role: { name: '乙', chat: { model: 'model-b' } } }
      ]);

      runStory('all', 'spec/feature.json');

      const headers = mockWriteFile.mock.calls
        .map((call: unknown[]) => call[1] as string)
        .filter((content: string) => content.startsWith('/sunny:commander-story'))
        .map((content: string) => content.split('\n')[0]);
      expect(headers).toContain('/sunny:commander-story model-a');
      expect(headers).toContain('/sunny:commander-story model-b');
    });
  });

  describe('已有索引的状态决定是否重新生成', () => {
    /** 让 index.md 返回指定内容，其余路径仍返回 feature 内容 */
    const withIndex = (rows: string): void => {
      mockReadFile.mockImplementation((p: string) => (p.endsWith('index.md') ? rows : FEATURE_JSON));
    };

    const promptFileOf = (topic: string): string => join(promptsDirOf('console'), `story-${topic}.md`);

    it('状态为 done 的主题不重新生成，保留原文件', () => {
      withIndex('| `.wuhua/agents/console/prompts/story-用户管理-今日用户.md` | `old` | done |');

      runStory('console', 'spec/feature.json');

      const writes = promptWritesUnder('console');
      expect(writes).not.toContain(promptFileOf('用户管理-今日用户'));
      expect(writes).toContain(promptFileOf('用户管理-用户列表'));
    });

    it('状态为 running 的主题同样不重新生成', () => {
      withIndex('| `.wuhua/agents/console/prompts/story-用户管理-今日用户.md` | `old` | running |');

      runStory('console', 'spec/feature.json');

      expect(promptWritesUnder('console')).not.toContain(promptFileOf('用户管理-今日用户'));
    });

    it('状态为 todo 的主题重新生成', () => {
      withIndex('| `.wuhua/agents/console/prompts/story-用户管理-今日用户.md` | `old` | todo |');

      runStory('console', 'spec/feature.json');

      expect(promptWritesUnder('console')).toContain(promptFileOf('用户管理-今日用户'));
    });

    it('索引中未出现的主题按 todo 处理，照常生成', () => {
      withIndex('| `.wuhua/agents/console/prompts/story-订单管理-待付款.md` | `old` | done |');

      runStory('console', 'spec/feature.json');

      const writes = promptWritesUnder('console');
      expect(writes).toContain(promptFileOf('用户管理-今日用户'));
      expect(writes).not.toContain(promptFileOf('订单管理-待付款'));
    });
  });

  describe('工作区校验', () => {
    it('非合规工作区时先校验工作区', () => {
      mockValidateWorkspace.mockImplementation(() => {
        throw new Error('当前目录不是合规的 wuhua 工作区');
      });

      expect(() => runStory('console', 'spec/feature.json')).toThrow('不是合规的 wuhua 工作区');
    });
  });
});
