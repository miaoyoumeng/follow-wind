import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { UsageTotals } from './types';

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
  output_missed: 0
});

/**
 * 解析单行 JSONL，累加 token 消耗到 totals；跳过非 assistant / 非目标日期 / 重复 id
 */
const accumulateLine = (line: string, targetDate: string, seenIds: Set<string>, totals: UsageTotals): void => {
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

  totals.input_cached += usage.cache_read_input_tokens ?? 0;
  totals.input_missed += (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  totals.output_missed += usage.output_tokens ?? 0;
};

/**
 * 扫描 Claude 会话目录，统计指定日期的 token 消耗
 * 字段映射：
 * - input_cached  ← cache_read_input_tokens
 * - input_missed  ← input_tokens + cache_creation_input_tokens
 * - output_cached ← 0（Claude API 无输出缓存）
 * - output_missed ← output_tokens
 * @param projectDir Claude 项目目录路径
 * @param targetDate 目标日期 yyyy-mm-dd
 */
export const scanDateUsage = (projectDir: string, targetDate: string): UsageTotals => {
  const totals = emptyTotals();
  if (!existsSync(projectDir)) return totals;

  const seenIds = new Set<string>();
  for (const entry of readdirSync(projectDir)) {
    if (!entry.endsWith('.jsonl')) continue;
    let content: string;
    try {
      content = readFileSync(join(projectDir, entry), 'utf-8');
    } catch {
      continue;
    }
    for (const line of content.split('\n')) {
      accumulateLine(line, targetDate, seenIds, totals);
    }
  }

  return totals;
};
