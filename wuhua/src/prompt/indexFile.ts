import { basename, isAbsolute, join, resolve } from 'path';

import { exists, readFile, writeFile } from '../utils/files';
import type { PromptIndexRow, PromptIndexStats, PromptStatus } from './types';

/** 已识别的状态集合，其余取值一律按 todo 处理 */
const KNOWN_STATUSES: readonly PromptStatus[] = ['todo', 'running', 'done'];

/** 统计行前缀，兼容不含 running 的旧格式 */
const STATS_LINE_PATTERN = /^共 \d+ 个文件/;

/** 表格行末的状态单元格 */
const STATUS_CELL_PATTERN = /\|\s*[^|]*\|\s*$/;

/**
 * 把状态列文本归一为已知状态
 * @param text 状态列原文
 * @returns 归一后的状态
 */
const normalizeStatus = (text: string): PromptStatus => {
  const lower = text.toLowerCase() as PromptStatus;
  return KNOWN_STATUSES.includes(lower) ? lower : 'todo';
};

/**
 * 拆分表格行单元格
 * @param line 一行文本
 * @returns 去掉反引号与首尾空白的单元格数组；不足三列时返回 null
 */
const splitRow = (line: string): string[] | null => {
  const cells = line
    .trim()
    .replace(/^\|+|\|+$/g, '')
    .split('|')
    .map(cell => cell.trim().replace(/`/g, ''));
  return cells.length >= 3 ? cells : null;
};

/**
 * 替换表格行末的状态单元格，保留其余内容原文
 * @param line 原始行
 * @param status 新状态
 * @returns 替换后的行
 */
const replaceStatusCell = (line: string, status: PromptStatus): string =>
  line.replace(STATUS_CELL_PATTERN, `| ${status} |`);

/**
 * 解析索引内容，取出全部数据行
 * 表头与分隔行因首列不是 .md 文件名而被自然过滤
 * @param content 索引文件内容，文件不存在时为 null
 * @returns 数据行列表
 */
export const parsePromptIndex = (content: string | null): PromptIndexRow[] => {
  if (!content) {
    return [];
  }
  const rows: PromptIndexRow[] = [];
  for (const line of content.split('\n')) {
    const cells = splitRow(line);
    if (!cells) {
      continue;
    }
    const fileName = basename(cells[0]);
    if (!fileName.endsWith('.md') || fileName === 'index.md') {
      continue;
    }
    rows.push({ storedPath: cells[0], fileName, md5: cells[1], status: normalizeStatus(cells[2]) });
  }
  return rows;
};

/**
 * 统计各状态的文件数
 * @param rows 数据行列表
 * @returns 统计结果
 */
export const countPromptStats = (rows: PromptIndexRow[]): PromptIndexStats => {
  const stats: PromptIndexStats = { total: rows.length, done: 0, running: 0, todo: 0 };
  for (const row of rows) {
    stats[row.status] += 1;
  }
  return stats;
};

/**
 * 渲染统计行文案
 * @param stats 统计结果
 * @returns 统计行文本
 */
export const formatPromptIndexStats = (stats: PromptIndexStats): string =>
  `共 ${stats.total} 个文件，done ${stats.done} 个，running ${stats.running} 个，todo ${stats.todo} 个。`;

/**
 * 读取索引文件并解析出数据行
 * @param indexFile 索引文件绝对路径
 * @returns 数据行列表；文件不存在时为空数组
 */
export const readPromptIndex = (indexFile: string): PromptIndexRow[] => parsePromptIndex(readFile(indexFile));

/**
 * 在内容层面改写目标行状态，并同步重算统计行
 * @param content 索引文件内容
 * @param fileName 目标文件基名
 * @param status 新状态
 * @returns 改写后的内容；未命中目标行时返回 null
 */
const rewriteStatus = (content: string, fileName: string, status: PromptStatus): string | null => {
  let isUpdated = false;
  const lines = content.split('\n').map(line => {
    if (STATS_LINE_PATTERN.test(line.trim())) {
      return line;
    }
    const cells = splitRow(line);
    if (cells && basename(cells[0]) === fileName) {
      isUpdated = true;
      return replaceStatusCell(line, status);
    }
    return line;
  });

  if (!isUpdated) {
    return null;
  }

  const stats = countPromptStats(parsePromptIndex(lines.join('\n')));
  return lines.map(line => (STATS_LINE_PATTERN.test(line.trim()) ? formatPromptIndexStats(stats) : line)).join('\n');
};

/**
 * 改写指定行的状态并写盘，统计行同步重算
 * 采用行级替换而非重建，避免重算 md5、打乱顺序
 * @param indexFile 索引文件绝对路径
 * @param fileName 目标文件基名
 * @param status 新状态
 * @returns 是否命中并写盘
 */
export const updatePromptIndexStatus = (indexFile: string, fileName: string, status: PromptStatus): boolean => {
  const content = readFile(indexFile);
  if (content === null) {
    return false;
  }
  const updated = rewriteStatus(content, fileName, status);
  if (updated === null) {
    return false;
  }
  writeFile(indexFile, updated);
  return true;
};

/**
 * 把残留的 running 行回退为 todo（上次执行被中断时的自愈）
 * @param indexFile 索引文件绝对路径
 * @returns 回退的条数；无 running 时不写盘
 */
export const resetRunningStatuses = (indexFile: string): number => {
  const content = readFile(indexFile);
  if (content === null) {
    return 0;
  }
  const runningRows = parsePromptIndex(content).filter(row => row.status === 'running');
  for (const row of runningRows) {
    updatePromptIndexStatus(indexFile, row.fileName, 'todo');
  }
  return runningRows.length;
};

/**
 * 解析索引行指向的 prompt 文件绝对路径
 * 优先按写入规则（相对 cwd）解析，其次回退到 prompts 目录下的同名文件，兼容旧布局
 * @param row 数据行
 * @param promptsDir prompts 目录绝对路径
 * @returns 存在的文件绝对路径；均不存在时返回 null
 */
export const resolvePromptFilePath = (row: PromptIndexRow, promptsDir: string): string | null => {
  const candidates = isAbsolute(row.storedPath)
    ? [row.storedPath]
    : [resolve(process.cwd(), row.storedPath), join(promptsDir, row.fileName)];

  for (const candidate of candidates) {
    if (exists(candidate)) {
      return candidate;
    }
  }
  return null;
};
