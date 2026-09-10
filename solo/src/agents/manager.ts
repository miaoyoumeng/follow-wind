import { isAbsolute, resolve } from 'path';
import { readConfig, writeConfig, type AgentPanes } from '../config';
import type { Agent } from './types';

/**
 * 获取所有 agent
 */
export const getAgents = (): Agent[] => {
  const { agents } = readConfig();
  const result: Agent[] = [];

  for (const [name, agent] of Object.entries(agents ?? {})) {
    result.push({
      name,
      workspace: resolveWorkspace(agent.workspace),
      activate: agent.activate ?? false,
      panes: agent.panes
    });
  }

  return result;
};

/**
 * 获取指定 agent
 */
export const getAgent = (name: string): Agent | undefined => {
  const { agents } = readConfig();
  const agent = agents?.[name];
  if (!agent) return undefined;
  return {
    name,
    workspace: resolveWorkspace(agent.workspace),
    activate: agent.activate ?? false,
    panes: agent.panes
  };
};

/**
 * 获取指定 agent 的 panes 配置（不存在或未配置时返回 undefined）
 */
export const getAgentPanes = (name: string): AgentPanes | undefined => {
  return getAgent(name)?.panes;
};

/**
 * 添加 agent（写入 config 的 agents）
 */
export const addAgent = (name: string, workspace: string): void => {
  const config = readConfig();
  const agents = { ...(config.agents ?? {}) };
  agents[name] = { workspace };
  writeConfig({ ...config, agents });
};

/**
 * 删除 agent（删除对应条目）
 */
export const removeAgent = (name: string): boolean => {
  const config = readConfig();
  const agents = { ...(config.agents ?? {}) };
  if (!agents[name]) return false;
  delete agents[name];
  writeConfig({ ...config, agents });
  return true;
};

/**
 * 解析 workspace 路径："/" 开头为绝对路径，否则相对于 process.cwd()
 */
export const resolveWorkspace = (workspace: string): string => {
  if (isAbsolute(workspace)) return workspace;
  return resolve(process.cwd(), workspace);
};
