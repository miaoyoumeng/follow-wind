export interface SettingsCheckResult {
  exists: boolean;
  path: string;
}

export interface CheckResult {
  installed: boolean;
  version?: string;
}

export interface TmuxCheckResult {
  installed: boolean;
  version?: string;
}
