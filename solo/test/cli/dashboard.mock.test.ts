import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

const { mockTerminal, mockSessionExists, mockValidateWorkspace } = vi.hoisted(() => ({
  mockTerminal: vi.fn(),
  mockSessionExists: vi.fn().mockResolvedValue(true),
  mockValidateWorkspace: vi.fn().mockReturnValue('sess-abc')
}));

vi.mock('../../src/process', () => ({
  terminal: mockTerminal
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
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('session 存在时调用 terminal 启动 tmux attach-session', async () => {
    await runDashboard();

    expect(mockTerminal).toHaveBeenCalledWith('tmux', ['attach-session', '-t', 'sess-abc']);
  });

  it('session 不存在时输出错误并退出', async () => {
    mockSessionExists.mockResolvedValue(false);
    mockExit.mockImplementationOnce(() => {
      throw new Error('process.exit');
    });

    await expect(runDashboard()).rejects.toThrow('process.exit');

    expect(mockTerminal).not.toHaveBeenCalled();
    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('');
    expect(output).toContain('is not running');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
