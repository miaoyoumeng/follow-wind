import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

const { mockExeca, mockSessionExists, mockValidateWorkspace } = vi.hoisted(() => ({
  mockExeca: vi.fn(),
  mockSessionExists: vi.fn().mockResolvedValue(true),
  mockValidateWorkspace: vi.fn().mockReturnValue('sess-abc')
}));

vi.mock('execa', () => ({
  execa: mockExeca
}));

vi.mock('../../src/tmux', () => ({
  sessionExists: mockSessionExists
}));

vi.mock('../../src/cli/status', () => ({
  validateWorkspace: mockValidateWorkspace
}));

const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

import { runDashboard } from '../../src/cli/dashboard';

describe('runDashboard', () => {
  let spy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockSessionExists.mockResolvedValue(true);
    mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('session 存在时接管终端 attach tmux session 并透传退出码', async () => {
    await runDashboard();

    expect(mockExeca).toHaveBeenCalledWith('tmux', ['attach-session', '-t', 'sess-abc'], {
      stdio: 'inherit',
      reject: false
    });
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('attach 异常退出时透传非零退出码', async () => {
    mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 3 });

    await runDashboard();

    expect(mockExit).toHaveBeenCalledWith(3);
  });

  it('session 不存在时输出错误并退出', async () => {
    mockSessionExists.mockResolvedValue(false);
    mockExit.mockImplementationOnce(() => {
      throw new Error('process.exit');
    });

    await expect(runDashboard()).rejects.toThrow('process.exit');

    expect(mockExeca).not.toHaveBeenCalled();
    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('');
    expect(output).toContain('is not running');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
