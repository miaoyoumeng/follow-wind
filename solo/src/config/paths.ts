import { join } from 'path';

// 基础目录名
export const SOLO_DIR_NAME = '.solo';

// 配置文件名
export const CONFIG_FILE_NAME = 'config.yaml';

// capture 子目录名
export const CAPTURE_DIR_NAME = 'capture';

// usage 统计文件名
export const USAGE_FILE_NAME = 'usage.json';

// 日志文件名
export const LOG_FILE_NAME = 'solo.log';

// PID 文件名
export const PID_FILE_NAME = 'pid';

// IPC socket 文件名模板（[name] 替换为配置中的 name）
export const IPC_SOCKET_NAME_TEMPLATE = 'ipc-[name].sock';

// Claude 项目根目录
export const CLAUDE_PROJECTS_DIR = join(process.env.HOME ?? '', '.claude', 'projects');

// 完整路径（基于当前工作目录）
export const SOLO_DIR = join(process.cwd(), SOLO_DIR_NAME);
export const CONFIG_PATH = join(SOLO_DIR, CONFIG_FILE_NAME);
export const CONFIG_PATH_NAME = join(SOLO_DIR_NAME, CONFIG_FILE_NAME);

export const CAPTURE_DIR = join(SOLO_DIR, CAPTURE_DIR_NAME);
export const USAGE_PATH = join(SOLO_DIR, USAGE_FILE_NAME);
export const PID_PATH = join(SOLO_DIR, PID_FILE_NAME);
export const LOG_FILE = join(SOLO_DIR, LOG_FILE_NAME);

// ── 动态路径 ──────────────────────────────────────────────

/** 当前配置文件路径（可通过 setConfigPath 覆盖，默认 = CONFIG_PATH） */
let currentConfigPath: string = CONFIG_PATH;

/**
 * 获取当前配置文件路径
 * @returns 配置文件绝对路径
 */
export const getConfigPath = (): string => currentConfigPath;

/**
 * 设置当前配置文件路径（用于 --config CLI 选项或测试隔离）
 * @param configPath 配置文件绝对路径
 */
export const setConfigPath = (configPath: string): void => {
  currentConfigPath = configPath;
};

/**
 * 根据项目 name 计算 IPC socket 文件路径
 * @param name 配置文件中的 name 字段
 * @returns socket 文件绝对路径
 */
export const getIpcSocketPath = (name: string): string => {
  return join(SOLO_DIR, `ipc-${name}.sock`);
};

// 导出路径对象，方便整体引用
export const paths = {
  soloDir: SOLO_DIR,
  config: CONFIG_PATH,
  capture: CAPTURE_DIR,
  usage: USAGE_PATH,
  soloDirName: SOLO_DIR_NAME,
  configFile: CONFIG_FILE_NAME,
  captureDirName: CAPTURE_DIR_NAME,
  usageFile: USAGE_FILE_NAME,
  pid: PID_PATH,
  pidFile: PID_FILE_NAME,
  ipcSocketFile: IPC_SOCKET_NAME_TEMPLATE,
  logFile: LOG_FILE,
  claudeProjectsDir: CLAUDE_PROJECTS_DIR
} as const;
