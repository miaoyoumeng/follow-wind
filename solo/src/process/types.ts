export type ExecFn = (cmd: string) => Promise<{ stdout: string; stderr: string }>;
