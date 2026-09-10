import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import chalk from 'chalk';

const {
  mockValidateWorkspace,
  mockGetAgent,
  mockReadFileSync,
  mockWriteFileSync,
  mockReaddirSync,
  mockExistsSync,
  mockMkdirSync
} = vi.hoisted(() => ({
  mockValidateWorkspace: vi.fn(),
  mockGetAgent: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockReaddirSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockMkdirSync: vi.fn()
}));

// commander 是外部 CLI 框架，mock 以阻止命令注册副作用
vi.mock('commander', () => {
  const proxy = new Proxy(function () {} as unknown as Record<string, unknown>, {
    get: (_t, prop) => (prop === 'then' ? undefined : proxy),
    apply: () => proxy
  });
  class MockCommand {
    constructor() {
      return proxy;
    }
  }
  return { Command: MockCommand };
});

// status 是环境校验依赖，mock 以隔离 runUsage 的调度逻辑
vi.mock('../../src/commander/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

// agents 是配置解析依赖，mock 以隔离 agent 查找逻辑
vi.mock('../../src/agents', () => ({
  getAgent: mockGetAgent
}));

// fs 是文件与目录操作依赖，mock 以隔离磁盘读写
vi.mock('fs', () => ({
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  readdirSync: mockReaddirSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync
}));

import { runUsage } from '../../src/commander/usage';

const SESSION_LINE = JSON.stringify({
  type: 'assistant',
  timestamp: '2026-09-09T10:00:00.000Z',
  message: {
    id: 'msg-1',
    model: 'claude-sonnet-4-5',
    usage: { input_tokens: 100, cache_read_input_tokens: 200, cache_creation_input_tokens: 50, output_tokens: 300 }
  }
});

describe('runUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateWorkspace.mockReturnValue('my-session');
    mockExistsSync.mockReturnValue(true);
    chalk.level = 3; // 强制启用颜色，验证实现中确实调用了 chalk
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('agent 不存在时抛出错误', async () => {
    mockGetAgent.mockReturnValue(undefined);
    await expect(runUsage('unknown')).rejects.toThrow('agent "unknown" 不存在');
  });

  it('日期格式不合法时，抛出错误并提示命令用法', async () => {
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/app', activate: true });
    await expect(runUsage('frontend', '20260909')).rejects.toThrow('用法: solo usage [agent name] [日期(可选)]');
  });

  it('无 usage.json 时，创建文件并写入今日统计', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);
    mockReadFileSync.mockImplementation((p: string) => {
      if (p.endsWith('.jsonl') && !p.endsWith('usage.json')) return SESSION_LINE;
      throw new Error('ENOENT');
    });

    await runUsage('frontend');

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    const [writePath, writeData] = mockWriteFileSync.mock.calls[0];
    expect(writePath).toBe(join(process.cwd(), '.solo', 'usage.json'));
    const parsed = JSON.parse(writeData as string);
    expect(parsed['2026-09-09']).toEqual({
      'claude-sonnet-4-5': {
        input_cached: 200,
        input_missed: 150,
        output: 300
      }
    });
  });

  it('指定日期时，统计该日期的消耗', async () => {
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const day08Line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-09-08T10:00:00.000Z',
      message: {
        id: 'msg-1',
        model: 'claude-sonnet-4-5',
        usage: { input_tokens: 100, cache_read_input_tokens: 200, cache_creation_input_tokens: 50, output_tokens: 300 }
      }
    });
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('.jsonl') && !(p as string).endsWith('usage.json')) return day08Line;
      throw new Error('ENOENT');
    });

    await runUsage('frontend', '2026-09-08');

    const [, writeData] = mockWriteFileSync.mock.calls[0];
    const parsed = JSON.parse(writeData as string);
    expect(parsed['2026-09-08']).toEqual({
      'claude-sonnet-4-5': {
        input_cached: 200,
        input_missed: 150,
        output: 300
      }
    });
    expect(parsed['2026-09-09']).toBeUndefined();
  });

  it('已有 usage.json 时，合并同日期数据', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    const existing = JSON.stringify({
      '2026-09-09': { 'claude-sonnet-4-5': { input_cached: 10, input_missed: 20, output: 30 } },
      '2026-09-08': { 'claude-sonnet-4-5': { input_cached: 1, input_missed: 2, output: 3 } }
    });
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('usage.json')) return existing;
      if ((p as string).endsWith('.jsonl')) return SESSION_LINE;
      throw new Error('ENOENT');
    });
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);

    await runUsage('frontend');

    const [, writeData] = mockWriteFileSync.mock.calls[0];
    const parsed = JSON.parse(writeData as string);
    // 2026-09-09 合并：10+200=210, 20+150=170, 30+300=330
    expect(parsed['2026-09-09']).toEqual({
      'claude-sonnet-4-5': {
        input_cached: 210,
        input_missed: 170,
        output: 330
      }
    });
    // 2026-09-08 保留不变
    expect(parsed['2026-09-08']).toEqual({
      'claude-sonnet-4-5': {
        input_cached: 1,
        input_missed: 2,
        output: 3
      }
    });
  });

  it('项目目录不存在时，写入零值统计', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockExistsSync.mockReturnValue(false);

    await runUsage('frontend');

    const [, writeData] = mockWriteFileSync.mock.calls[0];
    const parsed = JSON.parse(writeData as string);
    expect(parsed['2026-09-09']).toEqual({});
  });

  it('同 message.id 的多条记录只计一次', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    // 同一 message.id 出现两次（流式更新场景）
    const dupLines = `${SESSION_LINE}\n${SESSION_LINE}`;
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('.jsonl')) return dupLines;
      throw new Error('ENOENT');
    });

    await runUsage('frontend');

    const [, writeData] = mockWriteFileSync.mock.calls[0];
    const parsed = JSON.parse(writeData as string);
    // 去重后与单次一致
    expect(parsed['2026-09-09']).toEqual({
      'claude-sonnet-4-5': {
        input_cached: 200,
        input_missed: 150,
        output: 300
      }
    });
  });

  it('跳过非目标日期的消息', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const otherDayLine = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-09-08T10:00:00.000Z',
      message: {
        id: 'msg-old',
        model: 'claude-sonnet-4-5',
        usage: { input_tokens: 999, cache_read_input_tokens: 999, cache_creation_input_tokens: 999, output_tokens: 999 }
      }
    });
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('.jsonl')) return `${SESSION_LINE}\n${otherDayLine}`;
      throw new Error('ENOENT');
    });

    await runUsage('frontend');

    const [, writeData] = mockWriteFileSync.mock.calls[0];
    const parsed = JSON.parse(writeData as string);
    // 只统计今日，旧日期消息被跳过
    expect(parsed['2026-09-09']).toEqual({
      'claude-sonnet-4-5': {
        input_cached: 200,
        input_missed: 150,
        output: 300
      }
    });
  });

  it('跳过 model 为 "<synthetic>" 的消息', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const syntheticLine = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-09-09T10:00:00.000Z',
      message: {
        id: 'msg-synth',
        model: '<synthetic>',
        usage: { input_tokens: 999, cache_read_input_tokens: 999, cache_creation_input_tokens: 999, output_tokens: 999 }
      }
    });
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('.jsonl')) return `${SESSION_LINE}\n${syntheticLine}`;
      throw new Error('ENOENT');
    });

    await runUsage('frontend');

    const [, writeData] = mockWriteFileSync.mock.calls[0];
    const parsed = JSON.parse(writeData as string);
    // 只统计 claude-sonnet-4-5，<synthetic> 被跳过
    expect(parsed['2026-09-09']).toEqual({
      'claude-sonnet-4-5': {
        input_cached: 200,
        input_missed: 150,
        output: 300
      }
    });
    expect(parsed['2026-09-09']['<synthetic>']).toBeUndefined();
  });

  it('usage.json 按日期升序排序', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    // 已有数据日期乱序：09-10 在前，09-07 在后
    const existing = JSON.stringify({
      '2026-09-10': { 'claude-sonnet-4-5': { input_cached: 1, input_missed: 2, output: 3 } },
      '2026-09-07': { 'claude-sonnet-4-5': { input_cached: 4, input_missed: 5, output: 6 } }
    });
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('usage.json')) return existing;
      throw new Error('ENOENT');
    });
    mockReaddirSync.mockReturnValue([]);

    await runUsage('frontend');

    const [, writeData] = mockWriteFileSync.mock.calls[0];
    const keys = Object.keys(JSON.parse(writeData as string));
    expect(keys).toEqual(['2026-09-07', '2026-09-09', '2026-09-10']);
  });

  it('控制台输出今日总消耗与项目总消耗', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    // 已有 09-08 数据；今日 09-09 会从会话中计算
    const existing = JSON.stringify({
      '2026-09-08': { 'claude-sonnet-4-5': { input_cached: 10, input_missed: 20, output: 30 } }
    });
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('usage.json')) return existing;
      if ((p as string).endsWith('.jsonl')) return SESSION_LINE;
      throw new Error('ENOENT');
    });
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);

    await runUsage('frontend');

    const allOutput = consoleSpy.mock.calls.map(c => c[0] as string).join('\n');
    // 今日 09-09 = SESSION_LINE 值，标题带颜色
    expect(allOutput).toContain(chalk.cyan(`[2026-09-09]消耗：`));
    expect(allOutput).toContain('claude-sonnet-4-5');
    expect(allOutput).toContain('input_cached: 200');
    expect(allOutput).toContain('input_missed: 150');
    expect(allOutput).toContain('output: 300');
    // 总计 = 09-08 + 09-09
    expect(allOutput).toContain(chalk.cyan('总消耗：'));
    expect(allOutput).toContain('input_cached: 210');
    expect(allOutput).toContain('input_missed: 170');
    expect(allOutput).toContain('output: 330');

    consoleSpy.mockRestore();
  });

  it('控制台输出数字使用千位分隔符', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockGetAgent.mockReturnValue({ name: 'frontend', workspace: '/Users/me/app', activate: true });
    // 使用大数值触发千位分隔符
    const bigLine = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-09-09T10:00:00.000Z',
      message: {
        id: 'msg-big',
        model: 'claude-sonnet-4-5',
        usage: {
          input_tokens: 1000000,
          cache_read_input_tokens: 423894105,
          cache_creation_input_tokens: 17751768,
          output_tokens: 2006282
        }
      }
    });
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    mockReaddirSync.mockReturnValue(['sess-1.jsonl']);
    mockReadFileSync.mockImplementation((p: string) => {
      if ((p as string).endsWith('.jsonl')) return bigLine;
      throw new Error('ENOENT');
    });

    await runUsage('frontend');

    const allOutput = consoleSpy.mock.calls.map(c => c[0] as string).join('\n');
    expect(allOutput).toContain('423,894,105');
    expect(allOutput).toContain('18,751,768');
    expect(allOutput).toContain('2,006,282');

    consoleSpy.mockRestore();
  });
});
