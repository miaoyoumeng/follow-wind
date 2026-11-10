/**
 * 读取 gitbook 目录下相关文件
 */
import { readFile } from 'fs/promises';
import path from 'path';

import { getGitBookConfig } from '../store/index.js';

/**
 * 读取 gitbook 目录下相关文件
 * @param filePath
 */
export const gitbookFile = async (filePath: string): Promise<string | null> => {
  if (!filePath) {
    return null;
  }
  const mdConfig: AppConfig['gitbook'] = getGitBookConfig();
  const gitbookPath: string | undefined = mdConfig?.path;
  if (gitbookPath) {
    try {
      const fileName: string = path.join(gitbookPath, filePath);
      return await readFile(fileName, { encoding: 'utf8' });
    } catch (error) {
      // 可在此处进行自定义错误处理，比如重新抛出或记录日志
      console.log(`无法读取文件 ${filePath}: ${error}`);
    }
  }
  return null;
};
