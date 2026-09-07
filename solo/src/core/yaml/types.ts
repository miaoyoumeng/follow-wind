// pane 位置：只允许下列值
export type PanePosition = 'left' | 'right' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom';

// YAML 配置结构类型（panes：key 为位置，value 为 pane tag 名称）
export type AgentPanes = Partial<Record<PanePosition, string>>;

export interface AgentConfig {
  workspace: string;
  activate?: boolean;
  panes?: AgentPanes;
}

export interface SoloConfig {
  name: string;
  agents?: Record<string, AgentConfig>;
}
