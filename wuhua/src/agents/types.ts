import type { AgentPanes } from '../config';

export interface Agent {
  name: string;
  workspace: string; // 解析后的绝对路径
  activate: boolean; // 是否随 wuhua start 启动（配置缺失视为 false）
  panes?: AgentPanes;
}

export interface WorkspaceChecker {
  name: string;
  workspace: string;
  exists: boolean;
  settingsCreated: boolean;
}
