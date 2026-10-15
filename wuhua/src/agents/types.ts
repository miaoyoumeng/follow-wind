import type { AgentPanes, CompanyProductConfig, CompanyRoleConfig } from '../config';

export interface Agent {
  name: string;
  workspace: string; // 解析后的绝对路径
  activate: boolean; // 是否随 wuhua start 启动（配置缺失视为 false）
  waitTime?: number; // 等待该 agent 空闲的最大时间（分钟），缺省由调用方取默认值
  panes?: AgentPanes;
  role?: CompanyRoleConfig; // 该 agent 的工作角色，供 story 命令生成 prompt 使用
  product?: CompanyProductConfig; // 该 agent 负责的产品，供 story 命令生成 prompt 使用
}

export interface WorkspaceChecker {
  name: string;
  workspace: string;
  exists: boolean;
  settingsCreated: boolean;
}
