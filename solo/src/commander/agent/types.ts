export type AgentArgs =
  | { kind: 'help' }
  | { kind: 'error' }
  | { kind: 'add'; name: string; path: string }
  | { kind: 'workspace'; name: string }
  | { kind: 'panes'; name: string };
