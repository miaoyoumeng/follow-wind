import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

const { mockCheckSettings, mockCheckGit, mockCheckTmux, mockCheckClaude, mockReadConfig } = vi.hoisted(() => ({
  mockCheckSettings: vi.fn(),
  mockCheckGit: vi.fn(),
  mockCheckTmux: vi.fn(),
  mockCheckClaude: vi.fn(),
  mockReadConfig: vi.fn()
}));

vi.mock('../../src/envs', () => ({
  checkSettings: (...args: unknown[]): unknown => mockCheckSettings(...(args as [])),
  checkGit: (...args: unknown[]): unknown => mockCheckGit(...(args as [])),
  checkTmux: (...args: unknown[]): unknown => mockCheckTmux(...(args as [])),
  checkClaude: (...args: unknown[]): unknown => mockCheckClaude(...(args as []))
}));

vi.mock('../../src/config', () => ({
  readConfig: (...args: unknown[]): unknown => mockReadConfig(...(args as []))
}));

import { runDoctor } from '../../src/cli/doctor';

const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

describe('runDoctor', () => {
  let consoleSpy: MockInstance;
  let mockExit: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    mockExit.mockRestore();
  });

  const allPass = (): void => {
    mockCheckSettings.mockReturnValue({ exists: true, path: '/.solo/config.yaml' });
    mockReadConfig.mockReturnValue({ name: 'test-project' });
    mockCheckGit.mockResolvedValue({ installed: true, version: 'git version 2.39.0' });
    mockCheckTmux.mockResolvedValue({ installed: true, version: 'tmux 3.3a' });
    mockCheckClaude.mockResolvedValue({ installed: true, version: 'claude version 1.0.0' });
  };

  const output = (): string =>
    stripAnsi(consoleSpy.mock.calls.map((c: unknown[]) => String(c[0] as string)).join('\n'));

  it('全部通过时显示所有 ✅ 且不退出', async () => {
    allPass();

    await runDoctor();

    const out = output();
    expect(out).toContain('✅');
    expect(out).toContain('config.yaml');
    expect(out).toContain('git');
    expect(out).toContain('tmux');
    expect(out).toContain('claude');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('config.yaml 不存在时显示 ❌ 并退出', async () => {
    mockCheckSettings.mockReturnValue({ exists: false, path: '/.solo/config.yaml' });
    mockCheckGit.mockResolvedValue({ installed: true, version: 'git version 2.39.0' });
    mockCheckTmux.mockResolvedValue({ installed: true, version: 'tmux 3.3a' });
    mockCheckClaude.mockResolvedValue({ installed: true, version: 'claude version 1.0.0' });

    await runDoctor();

    const out = output();
    expect(out).toContain('❌');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('readConfig 抛出异常时显示解析错误', async () => {
    mockCheckSettings.mockReturnValue({ exists: true, path: '/.solo/config.yaml' });
    mockReadConfig.mockImplementation(() => {
      throw new Error('YAML parse error');
    });
    mockCheckGit.mockResolvedValue({ installed: true, version: 'git version 2.39.0' });
    mockCheckTmux.mockResolvedValue({ installed: true, version: 'tmux 3.3a' });
    mockCheckClaude.mockResolvedValue({ installed: true, version: 'claude version 1.0.0' });

    await runDoctor();

    const out = output();
    expect(out).toContain('❌');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('name 为空或非法时显示 ❌', async () => {
    mockCheckSettings.mockReturnValue({ exists: true, path: '/.solo/config.yaml' });
    mockReadConfig.mockReturnValue({ name: '' });
    mockCheckGit.mockResolvedValue({ installed: true, version: 'git version 2.39.0' });
    mockCheckTmux.mockResolvedValue({ installed: true, version: 'tmux 3.3a' });
    mockCheckClaude.mockResolvedValue({ installed: true, version: 'claude version 1.0.0' });

    await runDoctor();

    const out = output();
    expect(out).toContain('❌');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('git 未安装时显示 ❌', async () => {
    mockCheckSettings.mockReturnValue({ exists: true, path: '/.solo/config.yaml' });
    mockReadConfig.mockReturnValue({ name: 'test-project' });
    mockCheckGit.mockResolvedValue({ installed: false });
    mockCheckTmux.mockResolvedValue({ installed: true, version: 'tmux 3.3a' });
    mockCheckClaude.mockResolvedValue({ installed: true, version: 'claude version 1.0.0' });

    await runDoctor();

    const out = output();
    expect(out).toContain('❌');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('tmux 未安装时显示 ❌', async () => {
    mockCheckSettings.mockReturnValue({ exists: true, path: '/.solo/config.yaml' });
    mockReadConfig.mockReturnValue({ name: 'test-project' });
    mockCheckGit.mockResolvedValue({ installed: true, version: 'git version 2.39.0' });
    mockCheckTmux.mockResolvedValue({ installed: false });
    mockCheckClaude.mockResolvedValue({ installed: true, version: 'claude version 1.0.0' });

    await runDoctor();

    const out = output();
    expect(out).toContain('❌');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('claude 未安装时显示 ❌', async () => {
    mockCheckSettings.mockReturnValue({ exists: true, path: '/.solo/config.yaml' });
    mockReadConfig.mockReturnValue({ name: 'test-project' });
    mockCheckGit.mockResolvedValue({ installed: true, version: 'git version 2.39.0' });
    mockCheckTmux.mockResolvedValue({ installed: true, version: 'tmux 3.3a' });
    mockCheckClaude.mockResolvedValue({ installed: false });

    await runDoctor();

    const out = output();
    expect(out).toContain('❌');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('多项失败时全部报告', async () => {
    mockCheckSettings.mockReturnValue({ exists: false, path: '/.solo/config.yaml' });
    mockCheckGit.mockResolvedValue({ installed: false });
    mockCheckTmux.mockResolvedValue({ installed: true, version: 'tmux 3.3a' });
    mockCheckClaude.mockResolvedValue({ installed: false });

    await runDoctor();

    const out = output();
    // config ❌ + git ❌ + claude ❌ = 3 个 ❌
    const failCount = (out.match(/❌/g) ?? []).length;
    expect(failCount).toBeGreaterThanOrEqual(3);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
