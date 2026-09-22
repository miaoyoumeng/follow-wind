import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as CommanderType from 'commander';
import type * as TaskType from '../../src/task';

const { mockRunTaskWorker, registeredPrograms } = vi.hoisted(() => ({
  mockRunTaskWorker: vi.fn(),
  registeredPrograms: [] as unknown[]
}));

vi.mock('commander', async importOriginal => {
  const actual = await importOriginal<typeof CommanderType>();
  class RecordingCommand extends actual.Command {
    constructor(name?: string) {
      super(name);
      this.exitOverride();
      this.configureOutput({ writeOut: () => {}, writeErr: () => {} });
      registeredPrograms.push(this);
    }
    parse(): this {
      return this;
    }
  }
  return { ...actual, Command: RecordingCommand };
});

vi.mock('../../src/task', async importOriginal => {
  const actual = await importOriginal<typeof TaskType>();
  return {
    ...actual,
    runTaskWorker: mockRunTaskWorker
  };
});

vi.mock('../../src/logging', () => ({
  getLoggingConfig: vi.fn().mockReturnValue({ level: 'warn', file: '/dev/null' }),
  setup: vi.fn(),
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown
}));

import '../../src/bin/solo';

const program = registeredPrograms[0] as unknown as {
  commands: Array<{ name(): string; _hidden?: boolean }>;
  parseAsync: (argv: string[]) => Promise<void>;
};
const findCommand = (name: string) => program.commands.find(c => c.name() === name);

describe('_task-worker 隐藏命令', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('_task-worker 命令已注册', () => {
    const cmd = findCommand('_task-worker');
    expect(cmd).toBeDefined();
  });

  it('_task-worker 命令是隐藏的（不出现在 --help）', () => {
    const cmd = findCommand('_task-worker');
    expect(cmd?._hidden).toBe(true);
  });

  it('_task-worker 将参数正确传递给 runTaskWorker', async () => {
    await program.parseAsync([
      'node',
      'solo',
      '_task-worker',
      'task-20260101T120000',
      'my-session',
      'my-window',
      '2',
      'my-agent'
    ]);
    expect(mockRunTaskWorker).toHaveBeenCalledWith('task-20260101T120000', 'my-session', 'my-window', 2, 'my-agent');
  });

  it('_task-worker 不传 agentName 时第五个参数为 undefined', async () => {
    await program.parseAsync(['node', 'solo', '_task-worker', 'task-001', 'sess', 'win', '0']);
    expect(mockRunTaskWorker).toHaveBeenCalledWith('task-001', 'sess', 'win', 0, undefined);
  });
});
