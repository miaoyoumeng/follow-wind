import chalk from 'chalk';

import { validateWorkspace } from './status';
import type { AgentDispatchResult } from './types';
import { getAgent, getAgents, type Agent } from '../agents';
import { listPanes, sendKeys } from '../tmux';
import { logger } from '../logging';

/** --pane-index 省略时的默认 pane 索引 */
const DEFAULT_PANE_INDEX = 1;

/**
 * 解析执行目标：all 表示所有 activate 的 agent，其余按名称精确匹配
 * @param name agent 名称或 all
 * @returns 目标 agent 列表；agent 不存在时返回 null 并打印提示
 */
const resolveTargets = (name: string): Agent[] | null => {
  if (name === 'all') {
    return getAgents().filter(agent => agent.activate);
  }

  const agent = getAgent(name);
  if (!agent) {
    console.log(chalk.red(`❌ agent "${name}" 不存在`));
    return null;
  }
  return [agent];
};

/**
 * 把命令提交到单个 agent 的 tmux pane（提交后由 tmux 异步执行，wuhua 不等待结果）
 * @param session tmux session 名称
 * @param agent 目标 agent，名称即 window 名
 * @param paneIndex 目标 pane 索引
 * @param command 要执行的 shell 命令
 * @returns 提交结果
 */
const dispatchToPane = async (
  session: string,
  agent: Agent,
  paneIndex: number,
  command: string
): Promise<AgentDispatchResult> => {
  const target = `${session}:${agent.name}`;
  try {
    const panes = await listPanes(session, agent.name);
    if (!panes.includes(paneIndex)) {
      return {
        name: agent.name,
        paneIndex,
        isSuccess: false,
        error: `pane ${paneIndex} 不存在（可用 pane: ${panes.join(', ')}）`
      };
    }

    await sendKeys(session, agent.name, paneIndex, command);
    logger.debug(`[agent] 命令已提交到 ${target}.${paneIndex}: ${command}`);
    return { name: agent.name, paneIndex, isSuccess: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.debug(`[agent] ${target} 提交失败: ${reason}`);
    return { name: agent.name, paneIndex, isSuccess: false, error: `tmux 目标 ${target} 不可用，请确认已 wuhua start` };
  }
};

/**
 * 打印全部提交结果的汇总
 * @param results 全部提交结果
 * @returns 是否存在提交失败的 agent
 */
const printSummary = (results: AgentDispatchResult[]): boolean => {
  console.log('');
  for (const result of results) {
    const mark = result.isSuccess ? chalk.green('✅') : chalk.red('❌');
    const detail = result.error ? chalk.gray(` — ${result.error}`) : '';
    console.log(`${mark} ${result.name} (pane ${result.paneIndex})${detail}`);
  }

  const failed = results.filter(result => !result.isSuccess).length;
  console.log(chalk.gray(`汇总: 成功 ${results.length - failed} / 失败 ${failed}`));
  return failed > 0;
};

/**
 * 把 shell 命令提交到指定 agent 的 tmux pane 执行
 * @param name agent 名称，all 表示所有 activate 的 agent
 * @param paneIndex 目标 pane 索引，省略时取 1
 * @param command 要执行的 shell 命令
 */
export const runAgent = async (name: string, paneIndex: number | undefined, command: string): Promise<void> => {
  const session = validateWorkspace();

  if (command.trim() === '') {
    console.log(chalk.red('❌ --bash 命令不能为空'));
    process.exitCode = 1;
    return;
  }

  const index = paneIndex ?? DEFAULT_PANE_INDEX;
  if (!Number.isInteger(index) || index < 0) {
    console.log(chalk.red(`❌ --pane-index 必须是非负整数，收到: ${String(paneIndex)}`));
    process.exitCode = 1;
    return;
  }

  // 提示文案在 resolveTargets 内打印，错误写日志文件用户看不到，故不走抛错
  const agents = resolveTargets(name);
  if (agents === null) {
    process.exitCode = 1;
    return;
  }

  if (agents.length === 0) {
    console.log(chalk.yellow('📋 没有需要执行的 agent（agents 均未设置 activate）'));
    return;
  }

  const results: AgentDispatchResult[] = [];
  for (const agent of agents) {
    console.log(chalk.cyan(`\n[agent:${agent.name}] (pane ${index}) $ ${command}`));
    const result = await dispatchToPane(session, agent, index, command);
    if (!result.isSuccess) {
      console.log(chalk.red(`  ❌ ${result.error}`));
    }
    results.push(result);
  }

  if (printSummary(results)) {
    // 用 exitCode 而非 process.exit：stdout 为管道时，退出过急会截断尚未写完的输出
    process.exitCode = 1;
  }
};
