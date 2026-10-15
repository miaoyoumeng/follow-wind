import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';

const {
  mockValidateWorkspace,
  mockCheckDaemonAlive,
  mockGetAgent,
  mockGetAgents,
  mockListPanesWithTitle,
  mockIpcPaneStatus,
  mockIpcPrompt,
  mockExists,
  mockReadFile,
  mockWriteFile
} = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockCheckDaemonAlive: vi.fn(),
  mockGetAgent: vi.fn(),
  mockGetAgents: vi.fn(),
  mockListPanesWithTitle: vi.fn(),
  mockIpcPaneStatus: vi.fn(),
  mockIpcPrompt: vi.fn(),
  mockExists: vi.fn(),
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn()
}));

vi.mock('../../src/cli/status', () => ({ validateWorkspace: mockValidateWorkspace }));
vi.mock('../../src/cli/daemon', () => ({ checkDaemonAlive: mockCheckDaemonAlive }));
vi.mock('../../src/agents', () => ({ getAgent: mockGetAgent, getAgents: mockGetAgents }));
vi.mock('../../src/config', () => ({
  getAgentPromptsDir: (agentName: string): string => `${process.cwd()}/.wuhua/agents/${agentName}/prompts`
}));
vi.mock('../../src/tmux', () => ({ listPanesWithTitle: mockListPanesWithTitle }));
vi.mock('../../src/ipc', () => ({ ipcPaneStatus: mockIpcPaneStatus, ipcPrompt: mockIpcPrompt }));

// fs 是外部边界，mock 以隔离磁盘读写
vi.mock('../../src/utils/files', () => ({
  exists: mockExists,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  ensureDir: vi.fn(),
  appendFile: vi.fn(),
  stat: vi.fn(),
  readDir: vi.fn(),
  readStdin: vi.fn()
}));

vi.mock('../../src/logging', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

import { runPrompt } from '../../src/cli';
import { parsePromptIndex } from '../../src/prompt';
import type { Agent } from '../../src/agents';

const AGENT: Agent = { name: 'console', workspace: '/tmp/ws', activate: true };

/** 磁盘内容的可变替身：writeFile 后可被 readFile 读回，模拟真实读写 */
const files = new Map<string, string>();

const promptsDirOf = (agentName: string): string => join(process.cwd(), '.wuhua', 'agents', agentName, 'prompts');
const indexFileOf = (agentName: string): string => join(promptsDirOf(agentName), 'index.md');

/**
 * 写入一个索引文件
 * @param agentName agent 名称
 * @param rows [文件名, 状态] 列表
 */
const writeIndex = (agentName: string, rows: Array<[string, string]>): void => {
  const lines = [
    '# prompt 索引',
    '',
    `共 ${rows.length} 个文件。`,
    '',
    '| 文件 | md5 | 状态 |',
    '| --- | --- | --- |',
    ...rows.map(([fileName, status]) => `| \`.wuhua/agents/${agentName}/prompts/${fileName}\` | \`m\` | ${status} |`),
    ''
  ];
  files.set(indexFileOf(agentName), lines.join('\n'));
};

/**
 * 写入一个 prompt 文件
 * @param agentName agent 名称
 * @param fileName 文件名
 * @param content 文件内容
 */
const writePromptFile = (agentName: string, fileName: string, content: string): void => {
  files.set(join(promptsDirOf(agentName), fileName), content);
};

/**
 * 读取某行当前落盘的状态
 * @param agentName agent 名称
 * @param fileName 文件名
 * @returns 状态文本，行不存在时为空串
 */
const statusOnDisk = (agentName: string, fileName: string): string => {
  const rows = parsePromptIndex(files.get(indexFileOf(agentName)) ?? null);
  return rows.find(row => row.fileName === fileName)?.status ?? '';
};

/** 本次用例中 console.log 打印的全部行 */
let logged: string[] = [];

/**
 * 断言终端输出包含某段文案
 * @param fragment 期望出现的片段
 */
const expectLogged = (fragment: string): void => {
  expect(logged.join('\n')).toContain(fragment);
};

describe('runPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    files.clear();

    mockExists.mockImplementation((target: string) => files.has(target));
    mockReadFile.mockImplementation((target: string) => files.get(target) ?? null);
    mockWriteFile.mockImplementation((target: string, content: string) => {
      files.set(target, content);
    });

    mockValidateWorkspace.mockReturnValue('my-session');
    mockCheckDaemonAlive.mockReturnValue(true);
    mockGetAgent.mockReturnValue(AGENT);
    mockGetAgents.mockReturnValue([AGENT]);
    mockListPanesWithTitle.mockResolvedValue([{ index: 0, title: 'claude' }]);
    mockIpcPaneStatus.mockResolvedValue({ session: 'my-session', window: 'console', paneIndex: 0, status: 'idle' });
    mockIpcPrompt.mockResolvedValue('completed');

    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  describe('前置校验', () => {
    it('daemon 未启动时置退出码 1，且不解析 agent', async () => {
      mockCheckDaemonAlive.mockReturnValue(false);

      await runPrompt('console');

      expect(process.exitCode).toBe(1);
      expect(mockGetAgent).not.toHaveBeenCalled();
      expect(mockIpcPrompt).not.toHaveBeenCalled();
    });

    it('agent 不存在时置退出码 1', async () => {
      mockGetAgent.mockReturnValue(undefined);

      await runPrompt('nope');

      expectLogged('agent "nope" 不存在');
      expect(process.exitCode).toBe(1);
    });
  });

  describe('索引', () => {
    it('具名 agent 缺少索引时置退出码 1', async () => {
      await runPrompt('console');

      expectLogged('没有 prompt 索引');
      expect(process.exitCode).toBe(1);
    });

    it('all 模式下缺少索引只提示，不计失败', async () => {
      await runPrompt('all');

      expectLogged('没有 prompt 索引');
      expect(process.exitCode).toBeUndefined();
    });

    it('没有 todo 行时提示且不计失败', async () => {
      writeIndex('console', [['story-A.md', 'done']]);

      await runPrompt('console');

      expectLogged('没有待执行的 prompt');
      expect(process.exitCode).toBeUndefined();
      expect(mockIpcPrompt).not.toHaveBeenCalled();
    });
  });

  describe('pane 可用性', () => {
    beforeEach(() => {
      writeIndex('console', [['story-A.md', 'todo']]);
      writePromptFile('console', 'story-A.md', 'do it');
    });

    it('没有 claude pane 时置退出码 1', async () => {
      mockListPanesWithTitle.mockResolvedValue([{ index: 0, title: 'other' }]);

      await runPrompt('console');

      expectLogged('没有 claude pane');
      expect(process.exitCode).toBe(1);
      expect(mockIpcPrompt).not.toHaveBeenCalled();
    });

    it('pane 未注册 router 时置退出码 1', async () => {
      mockIpcPaneStatus.mockResolvedValue(null);

      await runPrompt('console');

      expectLogged('pane 未注册 router');
      expect(process.exitCode).toBe(1);
      expect(mockIpcPrompt).not.toHaveBeenCalled();
    });

    it('pane 已被其他任务占用时置退出码 1', async () => {
      mockIpcPaneStatus.mockResolvedValue({
        session: 'my-session',
        window: 'console',
        paneIndex: 0,
        status: 'running'
      });

      await runPrompt('console');

      expectLogged('正在执行其他任务');
      expect(process.exitCode).toBe(1);
      expect(mockIpcPrompt).not.toHaveBeenCalled();
    });

    it('pane 处于 error 时允许覆盖提交', async () => {
      mockIpcPaneStatus.mockResolvedValue({ session: 'my-session', window: 'console', paneIndex: 0, status: 'error' });

      await runPrompt('console');

      expect(mockIpcPrompt).toHaveBeenCalled();
    });
  });

  describe('执行单条', () => {
    beforeEach(() => {
      writeIndex('console', [['story-A.md', 'todo']]);
      writePromptFile('console', 'story-A.md', 'do it');
    });

    it('提交前置为 running，完成后置为 done', async () => {
      let statusDuringRun = '';
      mockIpcPrompt.mockImplementation(async () => {
        statusDuringRun = statusOnDisk('console', 'story-A.md');
        return 'completed';
      });

      await runPrompt('console');

      expect(statusDuringRun).toBe('running');
      expect(statusOnDisk('console', 'story-A.md')).toBe('done');
      expect(process.exitCode).toBeUndefined();
    });

    it('把 claude pane 的索引与超时毫秒数传给 IPC', async () => {
      mockListPanesWithTitle.mockResolvedValue([
        { index: 0, title: 'shell' },
        { index: 1, title: 'claude' }
      ]);

      await runPrompt('console', 5);

      expect(mockIpcPrompt).toHaveBeenCalledWith('my-session', 'console', 1, 'do it', 300000);
    });

    it('未传 --timeout 时回退 agent 配置的 waitTime（分钟）', async () => {
      mockGetAgent.mockReturnValue({ ...AGENT, waitTime: 2 });

      await runPrompt('console');

      expect(mockIpcPrompt).toHaveBeenCalledWith('my-session', 'console', 0, 'do it', 120000);
    });

    it('未传 --timeout 且未配置 waitTime 时回退默认 60 分钟', async () => {
      await runPrompt('console');

      expect(mockIpcPrompt).toHaveBeenCalledWith('my-session', 'console', 0, 'do it', 3600000);
    });

    it('prompt 内容去掉结尾空白后再提交', async () => {
      writePromptFile('console', 'story-A.md', 'do it\n\n');

      await runPrompt('console');

      expect(mockIpcPrompt).toHaveBeenCalledWith('my-session', 'console', 0, 'do it', 3600000);
    });

    it('残留的 running 行回退为 todo 后仍会被执行', async () => {
      writeIndex('console', [['story-A.md', 'running']]);

      await runPrompt('console');

      expectLogged('残留 running 已回退为 todo');
      expect(mockIpcPrompt).toHaveBeenCalledTimes(1);
      expect(statusOnDisk('console', 'story-A.md')).toBe('done');
    });
  });

  describe('失败路径', () => {
    it('超时回退 todo 并继续下一条，最终退出码 1', async () => {
      writeIndex('console', [
        ['story-A.md', 'todo'],
        ['story-B.md', 'todo']
      ]);
      writePromptFile('console', 'story-A.md', 'A');
      writePromptFile('console', 'story-B.md', 'B');
      mockIpcPrompt.mockResolvedValueOnce('timeout').mockResolvedValueOnce('completed');

      await runPrompt('console');

      expect(mockIpcPrompt).toHaveBeenCalledTimes(2);
      expect(statusOnDisk('console', 'story-A.md')).toBe('todo');
      expect(statusOnDisk('console', 'story-B.md')).toBe('done');
      expect(process.exitCode).toBe(1);
    });

    it('busy 时回退 todo 并终止该 agent 的后续执行', async () => {
      writeIndex('console', [
        ['story-A.md', 'todo'],
        ['story-B.md', 'todo']
      ]);
      writePromptFile('console', 'story-A.md', 'A');
      writePromptFile('console', 'story-B.md', 'B');
      mockIpcPrompt.mockResolvedValue('busy');

      await runPrompt('console');

      expect(mockIpcPrompt).toHaveBeenCalledTimes(1);
      expect(statusOnDisk('console', 'story-A.md')).toBe('todo');
      expect(process.exitCode).toBe(1);
    });

    it('prompt 文件不可读时保持 todo 并继续下一条', async () => {
      writeIndex('console', [
        ['story-A.md', 'todo'],
        ['story-B.md', 'todo']
      ]);
      writePromptFile('console', 'story-B.md', 'B');

      await runPrompt('console');

      expectLogged('prompt 文件不可读');
      expect(statusOnDisk('console', 'story-A.md')).toBe('todo');
      expect(statusOnDisk('console', 'story-B.md')).toBe('done');
      expect(process.exitCode).toBe(1);
    });

    it('IPC 抛错时向外传播，不静默吞掉', async () => {
      writeIndex('console', [['story-A.md', 'todo']]);
      writePromptFile('console', 'story-A.md', 'A');
      mockIpcPrompt.mockRejectedValue(new Error('socket closed'));

      await expect(runPrompt('console')).rejects.toThrow('socket closed');
    });
  });

  describe('--agent=all', () => {
    it('多个 agent 串行执行各自的列表', async () => {
      const agents: Agent[] = [
        { name: 'a1', workspace: '/tmp/a1', activate: true },
        { name: 'a2', workspace: '/tmp/a2', activate: true }
      ];
      mockGetAgents.mockReturnValue(agents);
      for (const agent of agents) {
        writeIndex(agent.name, [[`story-${agent.name}.md`, 'todo']]);
        writePromptFile(agent.name, `story-${agent.name}.md`, agent.name);
      }

      await runPrompt('all');

      const calledAgents = mockIpcPrompt.mock.calls.map((call: unknown[]) => call[1]);
      expect(calledAgents).toEqual(['a1', 'a2']);
      expect(process.exitCode).toBeUndefined();
    });

    it('其中一个 agent 失败不影响其余，最终退出码 1', async () => {
      const agents: Agent[] = [
        { name: 'a1', workspace: '/tmp/a1', activate: true },
        { name: 'a2', workspace: '/tmp/a2', activate: true }
      ];
      mockGetAgents.mockReturnValue(agents);
      writeIndex('a1', [['story-a1.md', 'todo']]);
      writePromptFile('a1', 'story-a1.md', 'a1');
      writeIndex('a2', [['story-a2.md', 'todo']]);
      writePromptFile('a2', 'story-a2.md', 'a2');
      mockIpcPrompt.mockResolvedValueOnce('timeout').mockResolvedValueOnce('completed');

      await runPrompt('all');

      expect(statusOnDisk('a1', 'story-a1.md')).toBe('todo');
      expect(statusOnDisk('a2', 'story-a2.md')).toBe('done');
      expect(process.exitCode).toBe(1);
    });
  });
});
