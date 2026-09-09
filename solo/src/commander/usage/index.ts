import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getAgent } from '../../core/agents';
import { CLAUDE_PROJECTS_DIR, USAGE_PATH } from '../../config/paths';
import { encodeProjectName, scanDateUsage, emptyTotals } from '../../usage';
import type { UsageData, UsageTotals } from '../../usage';
import { validateWorkspace } from '../status';

const formatDate = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTotals = (t: UsageTotals): string =>
  `input_cached: ${t.input_cached},\ninput_missed: ${t.input_missed},\noutput_missed: ${t.output_missed}`;

const sumAllDates = (data: UsageData): UsageTotals => {
  const totals = emptyTotals();
  for (const t of Object.values(data)) {
    totals.input_cached += t.input_cached;
    totals.input_missed += t.input_missed;
    totals.output_missed += t.output_missed;
  }
  return totals;
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

  const targetDate = dateStr ?? formatDate(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error(`日期格式错误: "${dateStr}"（应为 yyyy-mm-dd）。用法: solo usage [agent name] [日期(可选)]`);
  }

  // 读取已有 usage 数据
  let usageData: UsageData = {};
  try {
    usageData = JSON.parse(readFileSync(USAGE_PATH, 'utf-8'));
  } catch {
    // 文件不存在，初始化空对象
  }

  // 扫描 Claude 会话
  const projectName = encodeProjectName(agent.workspace);
  const projectDir = join(CLAUDE_PROJECTS_DIR, projectName);
  const totals = scanDateUsage(projectDir, targetDate);

  // 合并（覆盖写入同一日期）
  const existing = usageData[targetDate] ?? emptyTotals();
  usageData[targetDate] = {
    input_cached: existing.input_cached + totals.input_cached,
    input_missed: existing.input_missed + totals.input_missed,
    output_missed: existing.output_missed + totals.output_missed
  };

  // 按日期升序排序后写入
  const sorted: UsageData = {};
  for (const key of Object.keys(usageData).sort()) {
    sorted[key] = usageData[key];
  }
  writeFileSync(USAGE_PATH, JSON.stringify(sorted, null, 2));

  // 控制台输出
  const todayTotals = usageData[targetDate] ?? emptyTotals();
  console.log(chalk.cyan(`[${targetDate}]消耗：`) + `\n${formatTotals(todayTotals)}`);
  console.log(chalk.cyan('总消耗：') + `\n${formatTotals(sumAllDates(usageData))}`);
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
