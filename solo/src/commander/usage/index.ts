import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { getAgent } from '../../agents';
import { CLAUDE_PROJECTS_DIR, USAGE_PATH } from '../../config/paths';
import { encodeProjectName, scanDateUsage, emptyTotals } from '../../claude/usage';
import type { UsageData, UsageTotals } from '../../claude/usage';
import { validateWorkspace } from '../status';
import { formatDateOnly, readFile, writeFile } from '../../utils';

/**
 * 格式化数字为千位分隔符字符串
 */
const formatNumber = (n: number): string => n.toLocaleString('en-US');

/**
 * 格式化单模型的消耗为控制台输出（含缩进）
 */
const formatModelTotals = (model: string, t: UsageTotals): string =>
  `    ${model}\n        input_cached: ${formatNumber(t.input_cached)},\n        input_missed: ${formatNumber(t.input_missed)},\n        output: ${formatNumber(t.output)}`;

/**
 * 格式化全部模型的消耗为控制台输出
 */
const formatModelsBlock = (models: Record<string, UsageTotals>): string =>
  Object.entries(models)
    .map(([model, t]) => formatModelTotals(model, t))
    .join('\n');

/**
 * 合并所有日期的消耗，按 model 分组累加
 */
const sumAllDates = (data: UsageData): Record<string, UsageTotals> => {
  const result: Record<string, UsageTotals> = {};
  for (const models of Object.values(data)) {
    for (const [model, t] of Object.entries(models)) {
      if (!result[model]) result[model] = emptyTotals();
      result[model].input_cached += t.input_cached;
      result[model].input_missed += t.input_missed;
      result[model].output += t.output;
    }
  }
  return result;
};

/**
 * 合并扫描结果到已有数据中（按 model 分组累加）
 */
const mergeModels = (existing: Record<string, UsageTotals>, scanned: Record<string, UsageTotals>): Record<string, UsageTotals> => {
  const merged = { ...existing };
  for (const [model, t] of Object.entries(scanned)) {
    if (!merged[model]) merged[model] = emptyTotals();
    merged[model].input_cached += t.input_cached;
    merged[model].input_missed += t.input_missed;
    merged[model].output += t.output;
  }
  return merged;
};

/**
 * 统计指定 agent 在目标日期的 token 消耗，写入 .solo/usage.json（按日期升序）
 * 同时在控制台输出今日消耗与总消耗
 * @param agentName agent 名称
 * @param dateStr 可选日期 yyyy-mm-dd，默认今天
 */
export const runUsage = async (agentName: string, dateStr?: string): Promise<void> => {
  validateWorkspace();
  const agent = getAgent(agentName);
  if (!agent) throw new Error(`agent "${agentName}" 不存在`);

  const targetDate = dateStr ?? formatDateOnly();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error(`日期格式错误: "${dateStr}"（应为 yyyy-mm-dd）。用法: solo usage [agent name] [日期(可选)]`);
  }

  // 读取已有 usage 数据
  let usageData: UsageData = {};
  const content = readFile(USAGE_PATH);
  if (content) {
    try {
      usageData = JSON.parse(content);
    } catch {
      // 解析失败，使用空对象
    }
  }

  // 扫描 Claude 会话
  const projectName = encodeProjectName(agent.workspace);
  const projectDir = join(CLAUDE_PROJECTS_DIR, projectName);
  const scanned = scanDateUsage(projectDir, targetDate);

  // 合并（按 model 分组累加同一日期）
  const existing = usageData[targetDate] ?? {};
  usageData[targetDate] = mergeModels(existing, scanned);

  // 按日期升序排序后写入
  const sorted: UsageData = {};
  for (const key of Object.keys(usageData).sort()) {
    sorted[key] = usageData[key];
  }
  writeFile(USAGE_PATH, JSON.stringify(sorted, null, 2));

  // 控制台输出
  const todayModels = usageData[targetDate] ?? {};
  const totalModels = sumAllDates(usageData);
  console.log(chalk.cyan(`[${targetDate}]消耗：`));
  console.log(formatModelsBlock(todayModels));
  console.log(chalk.cyan('总消耗：'));
  console.log(formatModelsBlock(totalModels));
};

/**
 * 注册 solo usage 子命令
 * @param program commander 实例
 */
export const registerUsageCommand = (program: Command): void => {
  program
    .command('usage')
    .description('统计指定 agent 的 Claude token 消耗')
    .argument('<agent-name>', 'agent 名称')
    .argument('[date]', '统计日期 yyyy-mm-dd（默认今天）')
    .action(async (agentName: string, date?: string) => {
      await runUsage(agentName, date);
    });
};
