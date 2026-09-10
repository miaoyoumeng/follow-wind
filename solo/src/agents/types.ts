import type { AgentPanes } from '../config';

export interface Agent {
  name: string;
  workspace: string; // 解析后的绝对路径
  activate: boolean; // 是否随 solo start 启动（配置缺失视为 false）
  panes?: AgentPanes;
}

export interface SplitPlan {
  pattern: 'left-split' | 'right-split';
  steps: Array<{ orientation: '-h' | '-v'; target: 'original' | 'left' | 'right' }>;
  paneMap: Record<string, number>; // position → pane index
}

export interface WorkspaceCheckResult {
  name: string;
  workspace: string;
  exists: boolean;
  settingsCreated: boolean;
}
