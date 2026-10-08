import { getConfigPath } from '../config';
import { exists } from '../utils/files';
import type { SettingsResult } from './types';

/**
 * 检测 wuhua 配置文件是否存在
 * @returns 配置文件存在状态与路径
 */
export const checkSettings = (): SettingsResult => {
  const path = getConfigPath();
  return { exists: exists(path), path };
};
