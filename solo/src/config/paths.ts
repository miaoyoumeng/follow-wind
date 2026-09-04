import { join } from 'path';

// 基础目录名
export const SOLO_DIR_NAME = '.solo';

// 配置文件名
export const CONFIG_FILE_NAME = 'config';

// 完整路径（基于当前工作目录）
export const SOLO_DIR = join(process.cwd(), SOLO_DIR_NAME);
export const CONFIG_PATH = join(SOLO_DIR, CONFIG_FILE_NAME);

// 导出路径对象，方便整体引用
export const paths = {
  soloDir: SOLO_DIR,
  config: CONFIG_PATH,
  soloDirName: SOLO_DIR_NAME,
  configFile: CONFIG_FILE_NAME
} as const;
