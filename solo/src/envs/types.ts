/** 工具检测结果 */
export interface ToolResult {
  /** 是否已安装 */
  installed: boolean;
  /** 版本号（未安装时不存在） */
  version?: string;
}

/** 配置文件检测结果 */
export interface SettingsResult {
  /** 配置文件是否存在 */
  exists: boolean;
  /** 配置文件路径 */
  path: string;
}
