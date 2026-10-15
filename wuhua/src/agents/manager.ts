import { isAbsolute, resolve } from 'path';
import { readConfig } from '../config';
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
      waitTime: agent.waitTime,
      panes: agent.panes,
      role: agent.role,
      product: agent.product
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
  if (!agent) {
    return undefined;
  }
  return {
    name,
    workspace: resolveWorkspace(agent.workspace),
    activate: agent.activate ?? false,
    waitTime: agent.waitTime,
    panes: agent.panes,
    role: agent.role,
    product: agent.product
  };
};

/**
 * 解析 workspace 路径："/" 开头为绝对路径，否则相对于 process.cwd()
 */
export const resolveWorkspace = (workspace: string): string => {
  if (isAbsolute(workspace)) {
    return workspace;
  }
  return resolve(process.cwd(), workspace);
};
