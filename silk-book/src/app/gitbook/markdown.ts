import path from 'path';
import { readFile } from 'fs/promises';

import { getGitBookConfig } from '../store/index.js';

export const gitbookMarkDown = async (mdPath: string): Promise<string | object> => {
  const mdConfig: AppConfig['gitbook'] = getGitBookConfig();
  const gitbookPath: string | undefined = mdConfig?.path;
  if (gitbookPath) {
    try {
      const fileName: string = path.join(gitbookPath, mdPath);
      return await readFile(fileName, { encoding: 'utf8' });
    } catch (error) {
      // 可在此处进行自定义错误处理，比如重新抛出或记录日志
      console.log(`无法读取文件 ${path}: ${error}`);
    }
  }
  return '';
};
export const gitbookImages = async (image: string): Promise<string | object> => {
  const mdConfig: AppConfig['gitbook'] = getGitBookConfig();
  const gitbookPath: string | undefined = mdConfig?.path;
  if (gitbookPath) {
    try {
      return path.join('file://', gitbookPath, image);
    } catch (error) {
      // 可在此处进行自定义错误处理，比如重新抛出或记录日志
      console.log(`无法读取文件 ${path}: ${error}`);
    }
  }
  return '';
};

export const gitbookImagesBy = async (image: string, current: string): Promise<string | object> => {
  const mdConfig: AppConfig['gitbook'] = getGitBookConfig();
  const gitbookPath: string | undefined = mdConfig?.path;
  if (gitbookPath) {
    try {
      const fileName: string = path.join(gitbookPath, current);
      return 'file://' + path.join(fileName, image);
    } catch (error) {
      // 可在此处进行自定义错误处理，比如重新抛出或记录日志
      console.log(`无法读取文件 ${path}: ${error}`);
    }
  }
  return '';
};
