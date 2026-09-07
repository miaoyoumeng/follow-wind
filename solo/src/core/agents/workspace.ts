import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getAgents } from './manager';

export interface WorkspaceCheckResult {
  name: string;
  workspace: string;
  exists: boolean;
  settingsCreated: boolean;
}

/**
 * 检查单个 agent 的 workspace 状态
 */
const checkOneWorkspace = (name: string, workspace: string): WorkspaceCheckResult => {
  if (!existsSync(workspace)) {
    return { name, workspace, exists: false, settingsCreated: false };
  }

  const claudeDir = join(workspace, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');

  if (existsSync(settingsPath)) {
    return { name, workspace, exists: true, settingsCreated: false };
  }

  // 创建 .claude 目录（如不存在）和 settings.json
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }
  writeFileSync(settingsPath, '{}', 'utf-8');

  return { name, workspace, exists: true, settingsCreated: true };
};

/**
 * 检查所有 agent 的 workspace 状态，并在需要时创建 .claude/settings.json
 */
export const checkAgentWorkspaces = (): WorkspaceCheckResult[] => {
  return getAgents().map(agent => checkOneWorkspace(agent.name, agent.workspace));
};
