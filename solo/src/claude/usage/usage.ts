import { join } from 'path';
import type { UsageTotals } from './types';
import { readFile, exists, readDir } from '../../utils';

/**
 * 将绝对路径编码为 Claude 项目目录名
 * /Users/me/app → -Users-me-app
 */
export const encodeProjectName = (absPath: string): string => absPath.replace(/\//g, '-');

/**
 * 创建全零的 UsageTotals
 */
export const emptyTotals = (): UsageTotals => ({
  input_cached: 0,
  input_missed: 0,
  output: 0
});

/**
 * 解析单行 JSONL，累加 token 消耗到对应 model 的 totals；跳过非 assistant / 非目标日期 / 重复 id
 */
const accumulateLine = (line: string, targetDate: string, seenIds: Set<string>, models: Record<string, UsageTotals>): void => {
  if (!line.trim()) return;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(line);
  } catch {
    return;
  }
  if (parsed.type !== 'assistant') return;
  const timestamp = parsed.timestamp as string | undefined;
  if (!timestamp?.startsWith(targetDate)) return;

  const message = parsed.message as Record<string, unknown> | undefined;
  const msgId = message?.id as string | undefined;
  if (msgId && seenIds.has(msgId)) return;
  if (msgId) seenIds.add(msgId);

  const usage = message?.usage as Record<string, number> | undefined;
  if (!usage) return;

  const model = (message?.model as string | undefined) ?? 'unknown';
  if (model === '<synthetic>') return;
  if (!models[model]) {
    models[model] = emptyTotals();
  }
  const totals = models[model];

  totals.input_cached += usage.cache_read_input_tokens ?? 0;
  totals.input_missed += (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  totals.output += usage.output_tokens ?? 0;
};

/**
 * 扫描 Claude 会话目录，统计指定日期的 token 消耗（按 model 分组）
 * 字段映射：
 * - input_cached  ← cache_read_input_types
 * - input_missed  ← input_tokens + cache_creation_input_tokens
 * - output        ← output_tokens
 * @param projectDir Claude 项目目录路径
 * @param targetDate 目标日期 yyyy-mm-dd
 */
export const scanDateUsage = (projectDir: string, targetDate: string): Record<string, UsageTotals> => {
  const models: Record<string, UsageTotals> = {};
  if (!exists(projectDir)) return models;

  const seenIds = new Set<string>();
  for (const entry of readDir(projectDir)) {
    if (!entry.endsWith('.jsonl')) continue;
    const content = readFile(join(projectDir, entry));
    if (!content) continue;
    for (const line of content.split('\n')) {
      accumulateLine(line, targetDate, seenIds, models);
    }
  }

  return models;
};
