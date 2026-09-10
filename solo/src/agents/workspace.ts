import { join } from 'path';
import { getAgents } from './manager';
import { exists, ensureDir, writeFile } from '../utils';
import type { WorkspaceCheckResult } from './types';

/**
 * 检查单个 agent 的 workspace 状态
 */
const checkOneWorkspace = (name: string, workspace: string): WorkspaceCheckResult => {
  if (!exists(workspace)) {
    return { name, workspace, exists: false, settingsCreated: false };
  }

  const claudeDir = join(workspace, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');

  if (exists(settingsPath)) {
    return { name, workspace, exists: true, settingsCreated: false };
  }

  // 创建 .claude 目录和 settings.json
  ensureDir(claudeDir);
  writeFile(settingsPath, '{}');

  return { name, workspace, exists: true, settingsCreated: true };
};

/**
 * 检查所有 agent 的 workspace 状态，并在需要时创建 .claude/settings.json
 */
export const checkAgentWorkspaces = (): WorkspaceCheckResult[] => {
  return getAgents().map(agent => checkOneWorkspace(agent.name, agent.workspace));
};
