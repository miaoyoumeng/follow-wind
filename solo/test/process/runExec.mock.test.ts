import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChildProcess } from 'child_process';

const mockSpawn = vi.fn();

vi.mock('child_process', () => ({
  exec: vi.fn(),
  execFile: vi.fn(),
  spawn: (...args: unknown[]): unknown => mockSpawn(...(args as []))
}));

import { spawnChild, terminal } from '../../src/process/exec';

describe('spawnChild', () => {
  beforeEach(() => {
    mockSpawn.mockReset();
  });

  it('调用 child_process.spawn 并返回子进程', () => {
    const mockChild = { pid: 99 } as unknown as ChildProcess;
    mockSpawn.mockReturnValue(mockChild);

    const child = spawnChild('tmux', ['ls'], { stdio: 'inherit' });

    expect(mockSpawn).toHaveBeenCalledWith('tmux', ['ls'], { stdio: 'inherit' });
    expect(child).toBe(mockChild);
  });
});

const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('terminal', () => {
  beforeEach(() => {
    mockSpawn.mockReset();
  });

  it('调用 spawnChild 并传入 stdio: inherit', () => {
    mockSpawn.mockReturnValue({ on: vi.fn() } as unknown as ChildProcess);

    terminal('tmux', ['attach-session', '-t', 'solo']);

    expect(mockSpawn).toHaveBeenCalledWith('tmux', ['attach-session', '-t', 'solo'], { stdio: 'inherit' });
  });

  it('在子进程上监听 exit 事件', () => {
    const mockOn = vi.fn();
    mockSpawn.mockReturnValueOnce({ on: mockOn } as unknown as ChildProcess);

    terminal('tmux', ['attach-session', '-t', 'solo']);

    expect(mockOn).toHaveBeenCalledWith('exit', expect.any(Function));
  });

  it('子进程 exit 时调用 process.exit 并传递退出码', () => {
    const mockOn = vi.fn();
    mockSpawn.mockReturnValueOnce({ on: mockOn } as unknown as ChildProcess);

    terminal('tmux', ['attach-session', '-t', 'solo']);

    const exitHandler = mockOn.mock.calls[0][1] as (code: number | null) => void;
    exitHandler(0);

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('子进程 exit code 为 null 时调用 process.exit(0)', () => {
    const mockOn = vi.fn();
    mockSpawn.mockReturnValueOnce({ on: mockOn } as unknown as ChildProcess);

    terminal('tmux', ['attach-session', '-t', 'solo']);

    const exitHandler = mockOn.mock.calls[0][1] as (code: number | null) => void;
    exitHandler(null);

    expect(mockExit).toHaveBeenCalledWith(0);
  });
});
