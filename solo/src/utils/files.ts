import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync, statSync, readdirSync } from 'fs';
import type { Stats } from 'fs';
import { dirname } from 'path';

/**
 * 确保目录存在（递归创建）
 * @param dirPath 目录路径
 */
export const ensureDir = (dirPath: string): void => {
  mkdirSync(dirPath, { recursive: true });
};

/**
 * 写入文件（自动创建父目录）
 * @param filePath 文件路径
 * @param content 文件内容
 */
export const writeFile = (filePath: string, content: string): void => {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content);
};

/**
 * 追加内容到文件（自动创建父目录）
 * @param filePath 文件路径
 * @param content 追加内容
 */
export const appendFile = (filePath: string, content: string): void => {
  ensureDir(dirname(filePath));
  appendFileSync(filePath, content);
};

/**
 * 读取文件内容（文件不存在返回 null）
 * @param filePath 文件路径
 * @returns 文件内容或 null
 */
export const readFile = (filePath: string): string | null => {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
};

/**
 * 检查文件或目录是否存在
 * @param targetPath 路径
 * @returns 存在返回 true，否则 false
 */
export const exists = (targetPath: string): boolean => {
  return existsSync(targetPath);
};

/**
 * 获取文件或目录的统计信息
 * @param filePath 路径
 * @returns Stats 对象
 */
export const stat = (filePath: string): Stats => {
  return statSync(filePath);
};

/**
 * 读取目录内容（返回文件名列表）
 * @param dirPath 目录路径
 * @returns 文件名数组
 */
export const readDir = (dirPath: string): string[] => {
  return readdirSync(dirPath) as string[];
};
