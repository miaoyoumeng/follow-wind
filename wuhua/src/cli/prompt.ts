import chalk from 'chalk';
import { join } from 'path';

import { getAgent, getAgents, type Agent } from '../agents';
import { getAgentPromptsDir } from '../config';
import { ipcPaneStatus, ipcPrompt } from '../ipc';
import { listPanesWithTitle } from '../tmux';
import { logger } from '../logging';
import { exists, readFile } from '../utils/files';
import { validateWorkspace } from './status';
import { checkDaemonAlive } from './daemon';
import {
  readPromptIndex,
  resetRunningStatuses,
  resolvePromptFilePath,
  updatePromptIndexStatus,
  type PromptIndexRow,
  type PromptStatus
} from '../prompt';
import type { PromptTarget } from './types';
import type { PromptRunOutcome } from '../pipe';

/** --agent 取此值时表示配置中的全部 agent */
const ALL_AGENTS = 'all';

/** 命令行与 agent 配置都未给出超时时的默认分钟数 */
const DEFAULT_WAIT_MINUTES = 60;

/** 超时分钟数的下限，非法值一律回退默认 */
const MIN_WAIT_MINUTES = 1;

/**
 * 解析执行目标：all 表示配置中的全部 agent，其余按名称精确匹配
 * @param agentName agent 名称或 all
 * @returns 目标 agent 列表；agent 不存在时打印提示并返回 null
 */
const resolveTargets = (agentName: string): Agent[] | null => {
  if (agentName === ALL_AGENTS) {
    return getAgents();
  }

  const agent = getAgent(agentName);
  if (!agent) {
    console.log(chalk.red(`❌ agent "${agentName}" 不存在`));
    return null;
  }
  return [agent];
};

/**
 * 计算等待 Claude 空闲的超时毫秒数：命令行 > agent 配置 > 默认值
 * @param timeoutMinutes 命令行传入的分钟数
 * @param agentMinutes agent 配置的 waitTime 分钟数
 * @returns 超时毫秒数
 */
const resolveTimeoutMs = (timeoutMinutes: number | undefined, agentMinutes: number | undefined): number => {
  const minutes = timeoutMinutes ?? agentMinutes ?? DEFAULT_WAIT_MINUTES;
  const safeMinutes = Number.isFinite(minutes) && minutes >= MIN_WAIT_MINUTES ? minutes : DEFAULT_WAIT_MINUTES;
  return safeMinutes * 60_000;
};

/**
 * 定位 agent 的 claude pane（window 名即 agent 名）
 * @param sessionName tmux session 名
 * @param agentName agent 名称
 * @returns pane 索引；不存在时返回 null
 */
const resolveClaudePane = async (sessionName: string, agentName: string): Promise<number | null> => {
  const panes = await listPanesWithTitle(sessionName, agentName);
  return panes.find(p => p.title === 'claude')?.index ?? null;
};

/**
 * 校验 agent 的 pane 可被独占执行，不可用时打印原因
 * @param sessionName tmux session 名
 * @param agentName agent 名称
 * @returns claude pane 索引；不可用时返回 null
 */
const acquirePaneIndex = async (sessionName: string, agentName: string): Promise<number | null> => {
  const paneIndex = await resolveClaudePane(sessionName, agentName);
  if (paneIndex === null) {
    console.log(chalk.red(`❌ [agent:${agentName}] 没有 claude pane，请先运行 \`wuhua start\``));
    return null;
  }

  const paneStatus = await ipcPaneStatus(sessionName, agentName, paneIndex);
  if (paneStatus === null) {
    console.log(chalk.red(`❌ [agent:${agentName}] pane 未注册 router，请先运行 \`wuhua start\``));
    return null;
  }
  // 仅 running 拒绝：error 表示上一轮异常结束，允许覆盖重试
  if (paneStatus.status === 'running') {
    console.log(chalk.red(`❌ [agent:${agentName}] 正在执行其他任务，已拒绝`));
    return null;
  }
  return paneIndex;
};

/**
 * 回写索引行状态
 * @param indexFile 索引文件绝对路径
 * @param row 数据行
 * @param status 新状态
 */
const markStatus = (indexFile: string, row: PromptIndexRow, status: PromptStatus): void => {
  if (!updatePromptIndexStatus(indexFile, row.fileName, status)) {
    logger.warn(`[prompt] 索引行未命中，状态未更新: ${row.fileName}`);
  }
};

/**
 * 把执行结果转成用户可读的原因
 * @param outcome 执行结果
 * @returns 原因文案
 */
const describeOutcome = (outcome: PromptRunOutcome | 'unreadable'): string => {
  switch (outcome) {
    case 'timeout':
      return '等待 Claude 空闲超时，状态已回退为 todo';
    case 'busy':
      return 'agent 被其他任务占用，状态已回退为 todo';
    case 'no-router':
      return 'pane 未注册 router，请确认 wuhua 已启动';
    case 'aborted':
      return '等待被中断，状态已回退为 todo';
    default:
      return 'prompt 文件不可读';
  }
};

/**
 * 判断结果是否说明 pane 已不可用（继续执行只会重复失败）
 * @param outcome 执行结果
 * @returns true 表示应终止该 agent 的后续执行
 */
const isFatalOutcome = (outcome: PromptRunOutcome | 'unreadable'): boolean =>
  outcome === 'busy' || outcome === 'no-router' || outcome === 'aborted';

/**
 * 规范化 prompt 内容：统一换行并去掉结尾空白，避免经 tmux 发送出多余的提交
 * @param content 文件原文
 * @returns 规范化后的内容
 */
const normalizeContent = (content: string): string => content.replace(/\r\n/g, '\n').trimEnd();

/**
 * 执行单条 prompt，并把结果写回索引
 * @param indexFile 索引文件绝对路径
 * @param row 待执行的索引行
 * @param target 定位与超时上下文
 * @returns 执行结果；文件不可读时返回 unreadable
 */
const runOnePrompt = async (
  indexFile: string,
  row: PromptIndexRow,
  target: PromptTarget
): Promise<PromptRunOutcome | 'unreadable'> => {
  const promptFile = resolvePromptFilePath(row, getAgentPromptsDir(target.agentName));
  const content = promptFile === null ? null : readFile(promptFile);
  if (content === null) {
    console.log(chalk.red(`  ❌ prompt 文件不可读: ${row.storedPath}`));
    return 'unreadable';
  }

  markStatus(indexFile, row, 'running');
  const outcome = await ipcPrompt(
    target.sessionName,
    target.agentName,
    target.paneIndex,
    normalizeContent(content),
    target.timeoutMs
  );

  if (outcome === 'completed') {
    markStatus(indexFile, row, 'done');
    console.log(chalk.green('  ✅ 完成'));
    return outcome;
  }

  markStatus(indexFile, row, 'todo');
  console.log(chalk.red(`  ❌ ${describeOutcome(outcome)}`));
  return outcome;
};

/**
 * 串行执行待执行行，逐条回写索引状态
 * @param indexFile 索引文件绝对路径
 * @param rows 待执行行
 * @param target 定位与超时上下文
 * @returns 是否全部成功
 */
const executeRows = async (indexFile: string, rows: PromptIndexRow[], target: PromptTarget): Promise<boolean> => {
  let hasFailure = false;
  for (const [index, row] of rows.entries()) {
    console.log(chalk.cyan(`\n  [${index + 1}/${rows.length}] ${row.fileName}`));
    const outcome = await runOnePrompt(indexFile, row, target);
    if (outcome === 'completed') {
      continue;
    }
    hasFailure = true;
    // 超时与文件不可读只影响当前行；其余说明 pane 已不可用，继续只会重复失败
    if (isFatalOutcome(outcome)) {
      break;
    }
  }
  return !hasFailure;
};

/**
 * 读取待执行行，并把上次中断残留的 running 回退为 todo
 * @param indexFile 索引文件绝对路径
 * @param agentName agent 名称（仅用于提示）
 * @returns 状态为 todo 的数据行
 */
const loadTodoRows = (indexFile: string, agentName: string): PromptIndexRow[] => {
  const resetCount = resetRunningStatuses(indexFile);
  if (resetCount > 0) {
    console.log(chalk.gray(`   [agent:${agentName}] ${resetCount} 条残留 running 已回退为 todo`));
  }
  return readPromptIndex(indexFile).filter(row => row.status === 'todo');
};

/**
 * 处理单个 agent 的待执行列表
 * @param sessionName tmux session 名
 * @param agent 目标 agent
 * @param timeoutMinutes 命令行传入的超时分钟数
 * @param isNamed 是否为具名指定（all 模式下缺索引视为跳过，不算失败）
 * @returns 是否成功（无待执行项也算成功）
 */
const runForAgent = async (
  sessionName: string,
  agent: Agent,
  timeoutMinutes: number | undefined,
  isNamed: boolean
): Promise<boolean> => {
  const indexFile = join(getAgentPromptsDir(agent.name), 'index.md');
  if (!exists(indexFile)) {
    console.log(chalk.yellow(`📋 [agent:${agent.name}] 没有 prompt 索引，请先运行 \`wuhua story\``));
    return !isNamed;
  }

  const paneIndex = await acquirePaneIndex(sessionName, agent.name);
  if (paneIndex === null) {
    return false;
  }

  const rows = loadTodoRows(indexFile, agent.name);
  if (rows.length === 0) {
    console.log(chalk.yellow(`📋 [agent:${agent.name}] 没有待执行的 prompt`));
    return true;
  }

  const target: PromptTarget = {
    sessionName,
    agentName: agent.name,
    paneIndex,
    timeoutMs: resolveTimeoutMs(timeoutMinutes, agent.waitTime)
  };
  return executeRows(indexFile, rows, target);
};

/**
 * 按 prompts/index.md 中的 todo 列表逐条执行 prompt
 * 单个 agent 失败不影响其余 agent；--agent=all 时多个 agent 串行执行
 * @param agentName agent 名称，all 表示配置中的全部 agent
 * @param timeoutMinutes 等待 Claude 空闲的超时分钟数，缺省回退 agent 配置与默认值
 */
export const runPrompt = async (agentName: string, timeoutMinutes?: number): Promise<void> => {
  const sessionName = validateWorkspace();
  if (!checkDaemonAlive()) {
    process.exitCode = 1;
    return;
  }

  const agents = resolveTargets(agentName);
  if (agents === null) {
    process.exitCode = 1;
    return;
  }

  if (agents.length === 0) {
    console.log(chalk.yellow('📋 没有可处理的 agent'));
    return;
  }

  const isNamed = agentName !== ALL_AGENTS;
  let hasFailure = false;
  for (const agent of agents) {
    if (!(await runForAgent(sessionName, agent, timeoutMinutes, isNamed))) {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    // 用 exitCode 而非 process.exit：stdout 为管道时，退出过急会截断尚未写完的输出
    process.exitCode = 1;
  }
};
