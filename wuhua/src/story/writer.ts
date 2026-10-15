import { join, relative } from 'path';
import { createHash } from 'crypto';

import { ensureDir, readDir, readFile, writeFile } from '../utils/files';
import {
  countPromptStats,
  formatPromptIndexStats,
  parsePromptIndex,
  type PromptIndexRow,
  type PromptStatus
} from '../prompt';

/**
 * 确保 feature 文件同级存在 story 输出目录
 * @param featureDir feature 文件所在目录
 */
export const ensureOutputDirs = (featureDir: string): void => {
  ensureDir(join(featureDir, 'story'));
};

/**
 * 为主题创建 story/[主题] 目录，已存在则保留原内容
 * @param featureDir feature 文件所在目录
 * @param topic 叶子主题路径
 */
export const createTopicFiles = (featureDir: string, topic: string): void => {
  ensureDir(join(featureDir, 'story', topic));
};

/**
 * 主题对应的 prompt 文件名
 * @param topic 叶子主题路径
 * @returns 文件名，如 story-用户管理-今日用户.md
 */
export const promptFileName = (topic: string): string => `story-${topic}.md`;

/**
 * 把主题的 prompt 写入 prompts 目录，文件名为 story-[主题].md，已存在则覆盖
 * @param promptDir prompts 目录
 * @param topic 叶子主题路径
 * @param prompt prompt 文本
 * @returns 写入的文件路径
 */
export const writePromptFile = (promptDir: string, topic: string, prompt: string): string => {
  const promptFile = join(promptDir, promptFileName(topic));
  writeFile(promptFile, prompt);
  return promptFile;
};

/**
 * 返回文件内容的 md5 签名，读不到时返回空字符串
 * @param filePath 文件路径
 * @returns md5 十六进制字符串
 */
const md5OfFile = (filePath: string): string => {
  const content = readFile(filePath);
  if (content === null) {
    return '';
  }
  return createHash('md5').update(content).digest('hex');
};

/**
 * 从已有索引中读出「文件名 → 状态」映射
 * 保留人工标记的 done 与执行中的 running，其余一律按 todo 重建
 * @param content 索引文件内容，文件不存在时为 null
 * @returns 文件名到状态的映射
 */
const loadStatusByFileName = (content: string | null): Map<string, PromptStatus> => {
  const statusByFileName = new Map<string, PromptStatus>();
  for (const row of parsePromptIndex(content)) {
    if (row.status !== 'todo') {
      statusByFileName.set(row.fileName, row.status);
    }
  }
  return statusByFileName;
};

/**
 * 重建 prompts/index.md，索引目录下所有 markdown 文件（排除 index.md）
 * 每行三列：文件相对路径（基于当前工作目录）、md5 签名、状态（todo | running | done）
 * 已被标记为 done 或 running 的文件，状态保持不变
 * @param promptDir prompts 目录
 * @returns 索引文件路径
 */
export const writePromptIndex = (promptDir: string): string => {
  const indexFile = join(promptDir, 'index.md');
  const statusByFileName = loadStatusByFileName(readFile(indexFile));

  // 按文件名排序，保证多次执行时输出顺序一致
  const fileNames = readDir(promptDir)
    .filter(fileName => fileName.endsWith('.md') && fileName !== 'index.md')
    .sort();

  const rows: PromptIndexRow[] = fileNames.map(fileName => {
    const filePath = join(promptDir, fileName);
    return {
      storedPath: relative(process.cwd(), filePath),
      fileName,
      md5: md5OfFile(filePath),
      status: statusByFileName.get(fileName) ?? 'todo'
    };
  });

  const lines = [
    '# prompt 索引',
    '',
    formatPromptIndexStats(countPromptStats(rows)),
    '',
    '| 文件 | md5 | 状态 |',
    '| --- | --- | --- |',
    ...rows.map(row => `| \`${row.storedPath}\` | \`${row.md5}\` | ${row.status} |`),
    ''
  ];

  writeFile(indexFile, lines.join('\n'));
  return indexFile;
};
