// pane 位置：只允许下列值
export type PanePosition = 'left' | 'right' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom';

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
}

// 日志配置：level 为日志级别，file 为日志文件路径
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file: string;
}

export interface SoloConfig {
  name: string;
  agents?: Record<string, AgentConfig>;
  // 顶级 hooks：事件名称 → 是否启用（tmux hook 回调注册依据）
  hooks?: Record<string, boolean>;
  logging?: LoggingConfig;
}
