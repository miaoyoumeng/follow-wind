import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// mock checker
vi.mock('../../../src/core/checker', () => ({
  checkSettings: vi.fn().mockReturnValue({ exists: true, path: '/.solo/config' })
}));

// mock yaml
vi.mock('../../../src/core/yaml', () => ({
  readConfig: vi.fn().mockReturnValue({ name: 'test-project' })
}));

// mock agents
vi.mock('../../../src/core/agents', () => ({
  checkAgentWorkspaces: vi.fn()
}));

import { runStatus } from '../../../src/commander/status';
import { checkAgentWorkspaces, type WorkspaceCheckResult } from '../../../src/core/agents';

describe('runStatus', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('无 agent 时显示 workspace ready', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);

    await runStatus();

    const output = consoleSpy.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(output).toContain('workspace is ready');
    expect(output).toContain('test-project');
  });

  it('workspace 不存在时显示警告信息', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'frontend', workspace: '/path/frontend', exists: false, settingsCreated: false }
    ]);

    await runStatus();

    const output = consoleSpy.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(output).toContain('frontend');
    expect(output).toContain('/path/frontend');
    expect(output).toContain('不存在');
  });

  it('settings.json 被创建时显示提示', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'api', workspace: '/path/api', exists: true, settingsCreated: true }
    ]);

    await runStatus();

    const output = consoleSpy.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(output).toContain('api');
    expect(output).toContain('settings.json');
    expect(output).toContain('已创建');
  });

  it('所有 workspace 正常时显示成功状态', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'frontend', workspace: '/fe', exists: true, settingsCreated: false },
      { name: 'backend', workspace: '/be', exists: true, settingsCreated: false }
    ]);

    await runStatus();

    const output = consoleSpy.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(output).toContain('workspace is ready');
    expect(output).toContain('frontend');
    expect(output).toContain('backend');
  });
});
