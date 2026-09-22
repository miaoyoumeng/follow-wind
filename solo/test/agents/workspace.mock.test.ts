import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAgentWorkspaces } from '../../src/agents/workspace';
import type { WorkspaceCheckResult } from '../../src/agents/types';

// mock fs 模块
const mockExistsSync = vi.fn();
const mockMkdirSync = vi.fn();
const mockWriteFileSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]): boolean => mockExistsSync(...(args as [])) as boolean,
  mkdirSync: (...args: unknown[]): void => {
    mockMkdirSync(...(args as []));
  },
  writeFileSync: (...args: unknown[]): void => {
    mockWriteFileSync(...(args as []));
  }
}));

// mock yaml 模块
vi.mock('../../src/config', () => ({
  readConfig: vi.fn()
}));

// mock agents manager
vi.mock('../../src/agents/manager', () => ({
  getAgents: vi.fn()
}));

import { readConfig } from '../../src/config';
import { getAgents } from '../../src/agents/manager';

describe('checkAgentWorkspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('无 agent 配置时返回空数组', () => {
    vi.mocked(getAgents).mockReturnValue([]);

    const result = checkAgentWorkspaces();

    expect(result).toEqual([]);
  });

  it('workspace 目录不存在时返回 exists: false', () => {
    vi.mocked(getAgents).mockReturnValue([{ name: 'frontend', workspace: '/abs/path/frontend', activate: true }]);
    mockExistsSync.mockReturnValue(false);

    const result = checkAgentWorkspaces();

    expect(result).toEqual([
      { name: 'frontend', workspace: '/abs/path/frontend', exists: false, settingsCreated: false }
    ]);
  });

  it('workspace 存在且 .claude/settings.json 已存在时不创建文件', () => {
    vi.mocked(getAgents).mockReturnValue([{ name: 'backend', workspace: '/abs/path/backend', activate: true }]);
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/abs/path/backend') return true;
      if (p === '/abs/path/backend/.claude/settings.json') return true;
      return false;
    });

    const result = checkAgentWorkspaces();

    expect(result).toEqual([{ name: 'backend', workspace: '/abs/path/backend', exists: true, settingsCreated: false }]);
    expect(mockMkdirSync).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('workspace 存在但 .claude/settings.json 不存在时创建空 JSON', () => {
    vi.mocked(getAgents).mockReturnValue([{ name: 'api', workspace: '/abs/path/api', activate: false }]);
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/abs/path/api') return true;
      return false;
    });

    const result = checkAgentWorkspaces();

    expect(result).toEqual([{ name: 'api', workspace: '/abs/path/api', exists: true, settingsCreated: true }]);
    expect(mockMkdirSync).toHaveBeenCalledWith('/abs/path/api/.claude', { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith('/abs/path/api/.claude/settings.json', '{}');
  });

  it('workspace 存在但 .claude 目录已存在时只创建 settings.json', () => {
    vi.mocked(getAgents).mockReturnValue([{ name: 'web', workspace: '/abs/path/web', activate: true }]);
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/abs/path/web') return true;
      if (p === '/abs/path/web/.claude') return true;
      return false;
    });

    const result = checkAgentWorkspaces();

    expect(result).toEqual([{ name: 'web', workspace: '/abs/path/web', exists: true, settingsCreated: true }]);
    // ensureDir 总是调用 mkdirSync（recursive: true 时目录存在是 no-op）
    expect(mockMkdirSync).toHaveBeenCalledWith('/abs/path/web/.claude', { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith('/abs/path/web/.claude/settings.json', '{}');
  });

  it('多个 agent 时逐一检查', () => {
    vi.mocked(getAgents).mockReturnValue([
      { name: 'a', workspace: '/a', activate: true },
      { name: 'b', workspace: '/b', activate: true }
    ]);
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/a') return false;
      if (p === '/b') return true;
      if (p === '/b/.claude/settings.json') return false;
      return false;
    });

    const result = checkAgentWorkspaces();

    expect(result).toEqual([
      { name: 'a', workspace: '/a', exists: false, settingsCreated: false },
      { name: 'b', workspace: '/b', exists: true, settingsCreated: true }
    ]);
  });
});
