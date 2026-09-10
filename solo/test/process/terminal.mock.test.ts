import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock child_process：保留 exec（供 execAsync 使用），只 mock spawn
vi.mock(import('child_process'), async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    spawn: vi.fn(() => ({ on: vi.fn() }))
  };
});

// mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

import { terminal } from '../../src/process';
import { spawn } from 'child_process';

const mockSpawn = vi.mocked(spawn);

describe('terminal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该调用 spawn 并传入 stdio: inherit', () => {
    terminal('tmux', ['attach-session', '-t', 'solo']);

    expect(mockSpawn).toHaveBeenCalledWith('tmux', ['attach-session', '-t', 'solo'], {
      stdio: 'inherit'
    });
  });

  it('应该在 spawn 返回的子进程上监听 exit 事件', () => {
    const mockOn = vi.fn();
    mockSpawn.mockReturnValueOnce({ on: mockOn } as unknown as ReturnType<typeof spawn>);

    terminal('tmux', ['attach-session', '-t', 'solo']);

    expect(mockOn).toHaveBeenCalledWith('exit', expect.any(Function));
  });

  it('子进程 exit 时应调用 process.exit 并传递退出码', () => {
    const mockOn = vi.fn();
    mockSpawn.mockReturnValueOnce({ on: mockOn } as unknown as ReturnType<typeof spawn>);

    terminal('tmux', ['attach-session', '-t', 'solo']);

    const exitHandler = mockOn.mock.calls[0][1];
    exitHandler(0);

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('子进程 exit code 为 null 时应调用 process.exit(0)', () => {
    const mockOn = vi.fn();
    mockSpawn.mockReturnValueOnce({ on: mockOn } as unknown as ReturnType<typeof spawn>);

    terminal('tmux', ['attach-session', '-t', 'solo']);

    const exitHandler = mockOn.mock.calls[0][1];
    exitHandler(null);

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('应该返回 spawn 的子进程', () => {
    const mockChild = { on: vi.fn() } as unknown as ReturnType<typeof spawn>;
    mockSpawn.mockReturnValueOnce(mockChild);

    const result = terminal('tmux', ['attach-session', '-t', 'solo']);

    expect(result).toBe(mockChild);
  });
});
