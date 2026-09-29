import { join } from 'path';

// 基础目录名
export const SOLO_DIR_NAME = '.solo';

// 配置文件名
const CONFIG_FILE_NAME = 'config.yaml';

// capture 子目录名
const CAPTURE_DIR_NAME = 'capture';

// usage 统计文件名
const USAGE_FILE_NAME = 'usage.json';

// 日志文件名
const LOG_FILE_NAME = 'solo.log';

// PID 文件名
export const PID_FILE_NAME = 'pid';

// Claude 项目根目录
export const CLAUDE_PROJECTS_DIR = join(process.env.HOME ?? '', '.claude', 'projects');

// 完整路径（基于当前工作目录）
export const SOLO_DIR = join(process.cwd(), SOLO_DIR_NAME);
const CONFIG_PATH = join(SOLO_DIR, CONFIG_FILE_NAME);
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

/**
 * 根据 tmux 坐标计算 agent capture 文件路径
 * @param win tmux window 名称
 * @param paneIndex pane 索引
 * @returns agent capture 文件绝对路径
 */
export const getTmuxPaneCapturePath = (win: string, paneIndex: number): string => {
  return join(CAPTURE_DIR, `${win}-${paneIndex}.md`);
};
