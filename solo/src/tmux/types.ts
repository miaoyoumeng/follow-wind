export interface CurrentSessionInfo {
  id: string;
  name: string;
}

export interface WindowInfo {
  name: string;
  panes: number;
}

export type ExecFn = (cmd: string) => Promise<{ stdout: string; stderr: string }>;
