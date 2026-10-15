import chalk from 'chalk';
import { homedir } from 'os';
import { dirname, isAbsolute, join, resolve } from 'path';

import { getAgent, getAgents, type Agent } from '../agents';
import { getAgentPromptsDir, resolveCompanyConfig, type ResolvedCompanyConfig } from '../config';
import { logger } from '../logging';
import { readPromptIndex } from '../prompt';
import { validateWorkspace } from './status';
import { ensureDir, exists, readFile, stat } from '../utils/files';
import {
  buildStoryPrompt,
  createTopicFiles,
  ensureOutputDirs,
  promptFileName,
  randomPromptCount,
  validateFeatureFormat,
  walkFeature,
  writePromptFile,
  writePromptIndex
} from '../story';

/** --agent 取此值时表示配置中的全部 agent */
const ALL_AGENTS = 'all';

/**
 * 解析 --file：~ 展开为家目录；绝对路径原样返回；相对路径基于 agent 的 workspace
 * @param workspace 目标 agent 的工作目录
 * @param input 用户传入的路径
 * @returns feature 文件绝对路径
 */
const resolveFeatureFile = (workspace: string, input: string): string => {
  const expanded = input === '~' || input.startsWith('~/') ? join(homedir(), input.slice(1)) : input;
  return isAbsolute(expanded) ? expanded : resolve(workspace, expanded);
};

/**
 * 校验并读取 feature 文件
 * @param filePath feature 文件绝对路径
 * @returns 解析后的 feature 数据
 */
const loadFeatureFile = (filePath: string): unknown => {
  if (!exists(filePath)) {
    throw new Error(`文件不存在: ${filePath}\n请检查路径是否写错，或确认文件是否已被移动、删除。`);
  }

  if (stat(filePath).isDirectory()) {
    throw new Error(`该路径是一个目录，不是文件: ${filePath}\n请通过 --file 指定到具体的文件。`);
  }

  const content = readFile(filePath);
  if (content === null) {
    throw new Error(`文件存在，但没有读取权限: ${filePath}\n请检查文件权限，或更换一个可读的文件。`);
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`文件不是合法的 JSON，无法解析。\n原因：${reason}`, { cause: err });
  }
};

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
 * 把格式校验的问题清单拼成给用户看的提示
 * @param errors 问题清单
 * @returns 多行提示文案
 */
const describeFormatErrors = (errors: string[]): string => {
  return [
    'feature 文件格式不符合标准。',
    ...errors.map(message => `  - ${message}`),
    '标准格式：顶层为对象，每个键对应一个字符串数组，例如',
    '  {"用户管理": ["今日用户", "用户列表"]}'
  ].join('\n');
};

/**
 * 列出 agent 配置中缺失的必填字段
 * @param config agent 的 role / product 解析结果
 * @returns 缺失字段在 agent 段下的相对路径列表，全部齐备时为空数组
 */
const findMissingFields = (config: ResolvedCompanyConfig): string[] => {
  const missing: string[] = [];
  if (!config.role.name) {
    missing.push('role.name');
  }
  if (!config.product.name) {
    missing.push('product.name');
  }
  if (!config.product.story.as) {
    missing.push('product.story.as');
  }
  return missing;
};

/**
 * 解析并校验 agent 的 role / product 配置
 * @param agent 目标 agent
 * @returns 解析后的配置；缺失必填字段时打印提示并返回 null
 */
const resolveAgentConfig = (agent: Agent): ResolvedCompanyConfig | null => {
  // 配置挂在该 agent 段下，缺失时 resolveCompanyConfig 会静默补默认值，
  // 生成出来的 prompt 变量全是空的，故先校验再生成
  const config = resolveCompanyConfig({ role: agent.role, product: agent.product });
  const missing = findMissingFields(config);
  if (missing.length === 0) {
    return config;
  }

  const prefix = `agents.${agent.name}.`;
  const list = missing.map(field => `  - ${prefix}${field}`).join('\n');
  console.log(
    chalk.red(
      `❌ [agent:${agent.name}] 缺少必填配置：\n${list}\n请在 .wuhua/config.yaml 的 ${prefix.slice(0, -1)} 段中补齐。`
    )
  );
  return null;
};

/**
 * 为单个 agent 生成 prompt 产物（写入 <cwd>/.wuhua/agents/<agent>/prompts/）
 * @param agent 目标 agent
 * @param rawPath 用户传入的 --file
 * @returns 是否成功
 */
const runForAgent = (agent: Agent, rawPath: string): boolean => {
  const config = resolveAgentConfig(agent);
  if (config === null) {
    return false;
  }

  const featureFile = resolveFeatureFile(agent.workspace, rawPath);

  let data: unknown;
  try {
    data = loadFeatureFile(featureFile);
  } catch (err) {
    console.log(chalk.red(`❌ [agent:${agent.name}] ${err instanceof Error ? err.message : String(err)}`));
    return false;
  }

  const errors = validateFeatureFormat(data);
  if (errors.length > 0) {
    console.log(chalk.red(`❌ [agent:${agent.name}] ${describeFormatErrors(errors)}`));
    return false;
  }

  const promptDir = getAgentPromptsDir(agent.name);
  const featureDir = dirname(featureFile);
  ensureOutputDirs(featureDir);
  ensureDir(promptDir);

  // 索引里非 todo 的主题已生成并执行过，保留原文件不重新生成
  const statusByFileName = new Map(readPromptIndex(join(promptDir, 'index.md')).map(row => [row.fileName, row.status]));

  for (const topic of walkFeature(data)) {
    if ((statusByFileName.get(promptFileName(topic)) ?? 'todo') !== 'todo') {
      continue;
    }
    createTopicFiles(featureDir, topic);
    const prompt = buildStoryPrompt({
      topic,
      storyFolder: join(featureDir, 'story', topic),
      config,
      count: randomPromptCount(config.product.story.min, config.product.story.max)
    });
    writePromptFile(promptDir, topic, prompt);
    logger.debug(`[agent:${agent.name}] story prompt 已生成: ${topic}`);
  }

  // 索引放在循环之后统一重建，目录里已有的历史文件也会一并纳入
  writePromptIndex(promptDir);
  return true;
};

/**
 * 依据 feature 文件为主题生成 user story prompt，写入 <cwd>/.wuhua/agents/<agent>/prompts/
 * 主题的角色与产品取自该 agent 段下的 role / product；单个 agent 失败不影响其余 agent
 * @param agentName agent 名称，all 表示配置中的全部 agent
 * @param filePath feature 文件路径，相对路径基于 agent 的 workspace 解析
 */
export const runStory = (agentName: string, filePath: string): void => {
  validateWorkspace();

  // 提示文案在 resolveTargets 内打印，错误写日志文件用户看不到，故不走抛错
  const agents = resolveTargets(agentName);
  if (agents === null) {
    process.exitCode = 1;
    return;
  }

  if (agents.length === 0) {
    console.log(chalk.yellow('📋 没有可处理的 agent'));
    return;
  }

  let hasFailure = false;
  for (const agent of agents) {
    if (!runForAgent(agent, filePath)) {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    // 用 exitCode 而非 process.exit：stdout 为管道时，退出过急会截断尚未写完的输出
    process.exitCode = 1;
  }
};
