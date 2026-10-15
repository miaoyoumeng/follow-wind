// pane 位置：只允许下列值
export type PanePosition =
  'one' | 'top' | 'bottom' | 'left' | 'right' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom';

// pane 条目：layout 为位置，booter 为可选启动命令，hooks 为可选钩子配置
export interface PaneEntry {
  layout: PanePosition;
  booter?: string;
  hooks?: Record<string, unknown>;
}

// YAML 配置结构类型（panes：key 为 tag 名称，value 为 PaneEntry）
// Object.keys 顺序与 YAML 书写顺序一致，用于确定 pane 编号
export type AgentPanes = Record<string, PaneEntry>;

export interface AgentConfig {
  workspace: string;
  activate?: boolean;
  panes?: AgentPanes;
  /** 等待 agent 空闲的最大时间（分钟），默认 60 */
  waitTime?: number;
  /** 该 agent 的工作角色，供 story 命令生成 prompt 使用 */
  role?: CompanyRoleConfig;
  /** 该 agent 负责的产品，供 story 命令生成 prompt 使用 */
  product?: CompanyProductConfig;
}

// 日志配置：level 和 file 均为可选，未配置时使用默认值
export interface LoggingConfig {
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  file?: string;
}

// Task 配置：coreSize 为默认维护数量，maxSize 为最大维护数量（上限 128）
export interface TaskConfig {
  coreSize?: number;
  maxSize?: number;
}

// company.role.chat 配置：model 为生成 prompt 时使用的对话模型标识
export interface CompanyRoleChatConfig {
  model?: string;
}

// company.role 配置：name 为 agent 工作标题
export interface CompanyRoleConfig {
  name?: string;
  chat?: CompanyRoleChatConfig;
}

// company.product.story 配置：as 为生成 story 时扮演的角色，min / max 为生成条数范围
export interface CompanyStoryConfig {
  as?: string;
  min?: number;
  max?: number;
}

// company.product 配置：name 为系统名称
export interface CompanyProductConfig {
  name?: string;
  story?: CompanyStoryConfig;
}

// company 段：公司级配置；role / product 现挂在各 agent 段下，story 命令不再读取本段的这两项
export interface CompanyConfig {
  role?: CompanyRoleConfig;
  product?: CompanyProductConfig;
  description?: string;
}

// company 配置补齐默认值后的结果，供 prompt 生成直接使用
export interface ResolvedCompanyConfig {
  role: {
    name: string;
    chat: Required<CompanyRoleChatConfig>;
  };
  product: {
    name: string;
    story: Required<CompanyStoryConfig>;
  };
  description: string;
}

export interface WuhuaConfig {
  name: string;
  agents?: Record<string, AgentConfig>;
  // hooks 按 endpoint 分组，目前仅支持 tmux
  hooks?: {
    tmux?: Record<string, boolean>;
  };
  logging?: LoggingConfig;
  task?: TaskConfig;
  company?: CompanyConfig;
}
