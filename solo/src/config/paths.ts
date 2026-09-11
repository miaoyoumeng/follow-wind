import { join } from 'path';

// 基础目录名
export const SOLO_DIR_NAME = '.solo';

// 配置文件名
export const CONFIG_FILE_NAME = 'config.yaml';

// capture 子目录名
export const CAPTURE_DIR_NAME = 'capture';

// usage 统计文件名
export const USAGE_FILE_NAME = 'usage.json';

// PID 文件名
export const PID_FILE_NAME = 'pid';

// IPC socket 文件名
export const IPC_SOCKET_NAME = 'ipc.sock';

// Claude 项目根目录
export const CLAUDE_PROJECTS_DIR = join(process.env.HOME ?? '', '.claude', 'projects');

// 完整路径（基于当前工作目录）
export const SOLO_DIR = join(process.cwd(), SOLO_DIR_NAME);
export const CONFIG_PATH = join(SOLO_DIR, CONFIG_FILE_NAME);
export const CONFIG_PATH_NAME = join(SOLO_DIR_NAME, CONFIG_FILE_NAME);

export const CAPTURE_DIR = join(SOLO_DIR, CAPTURE_DIR_NAME);
export const USAGE_PATH = join(SOLO_DIR, USAGE_FILE_NAME);
export const PID_PATH = join(SOLO_DIR, PID_FILE_NAME);
export const IPC_SOCKET_PATH = join(SOLO_DIR, IPC_SOCKET_NAME);

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
  ipcSocket: IPC_SOCKET_PATH,
  ipcSocketFile: IPC_SOCKET_NAME,
  claudeProjectsDir: CLAUDE_PROJECTS_DIR
} as const;
