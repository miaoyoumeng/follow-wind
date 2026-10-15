import { dump, load } from 'js-yaml';
import { dirname } from 'path';
import { LOG_FILE, getConfigPath } from '../paths';
import { exists, ensureDir, readFile, writeFile } from '../../utils/files';
import type {
  PanePosition,
  PaneEntry,
  AgentPanes,
  AgentConfig,
  WuhuaConfig,
  LoggingConfig,
  TaskConfig,
  CompanyConfig,
  CompanyRoleConfig,
  CompanyProductConfig,
  CompanyStoryConfig,
  ResolvedCompanyConfig
} from './types';

// dump 选项：与示例保持一致缩进
const YAML_DUMP_OPTIONS = { indent: 4 } as const;

// 允许的 pane 位置值
const VALID_PANE_POSITIONS: ReadonlySet<string> = new Set([
  'one',
  'top',
  'bottom',
  'left',
  'right',
  'left-top',
  'right-top',
  'left-bottom',
  'right-bottom'
]);

/**
 * 校验位置值是否合法（panes 只允许 6 个值）
 */
export const isValidPanePosition = (value: unknown): boolean => {
  return typeof value === 'string' && VALID_PANE_POSITIONS.has(value);
};

/**
 * 解析 panes 对象（新格式：key 为 tag 名，value 为含 layout 的对象）
 * 过滤非法 layout 值和非对象 value，保留 Object.keys 顺序
 */
export const parsePanes = (rawPanes: Record<string, unknown>): AgentPanes | undefined => {
  const panes: AgentPanes = {};
  for (const [tag, raw] of Object.entries(rawPanes)) {
    if (typeof raw !== 'object' || raw === null) {
      continue;
    }
    const entry = raw as Record<string, unknown>;
    if (!isValidPanePosition(entry.layout)) {
      continue;
    }
    const paneEntry: PaneEntry = { layout: entry.layout as PanePosition };
    if (typeof entry.booter === 'string') {
      paneEntry.booter = entry.booter;
    }
    if (typeof entry.hooks === 'object' && entry.hooks !== null) {
      paneEntry.hooks = entry.hooks as Record<string, unknown>;
    }
    panes[tag] = paneEntry;
  }
  return Object.keys(panes).length > 0 ? panes : undefined;
};

/**
 * 从 raw agent 对象构建 AgentConfig 条目
 */
const buildAgentEntry = (raw: Record<string, unknown>): AgentConfig | null => {
  if (typeof raw.workspace !== 'string') {
    return null;
  }
  const entry: AgentConfig = { workspace: raw.workspace };
  if (typeof raw.activate === 'boolean') {
    entry.activate = raw.activate;
  }
  if (typeof raw.waitTime === 'number') {
    entry.waitTime = raw.waitTime;
  }
  if (typeof raw.panes === 'object' && raw.panes !== null) {
    const panes = parsePanes(raw.panes as Record<string, unknown>);
    if (panes) {
      entry.panes = panes;
    }
  }
  const role = parseCompanyRole(raw.role);
  if (role) {
    entry.role = role;
  }
  const product = parseCompanyProduct(raw.product);
  if (product) {
    entry.product = product;
  }
  return entry;
};

/**
 * 解析 hooks 段的指定 endpoint 子段：仅保留 boolean 值条目（事件名 → 启用状态）
 */
const parseHookEndpoint = (raw: unknown): Record<string, boolean> => {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const result: Record<string, boolean> = {};
  for (const [event, enabled] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof enabled === 'boolean') {
      result[event] = enabled;
    }
  }
  return result;
};

/**
 * 解析顶级 hooks 段：按 endpoint 分组解析，目前仅支持 tmux
 */
const parseHooks = (raw: unknown): WuhuaConfig['hooks'] => {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  const tmux = parseHookEndpoint(obj.tmux);
  if (Object.keys(tmux).length === 0) {
    return {};
  }
  return { tmux };
};

/**
 * 解析顶级 logging 段：level 和 file 均为可选字符串，缺失则留空由 resolveLoggingConfig 补默认值。
 * 若字段存在但类型非法（非字符串），则该字段丢弃。
 */
const parseLogging = (raw: unknown): LoggingConfig | undefined => {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const obj = raw as Record<string, unknown>;
  const result: LoggingConfig = {};
  if (typeof obj.level === 'string') {
    result.level = obj.level as LoggingConfig['level'];
  }
  if (typeof obj.file === 'string') {
    result.file = obj.file;
  }
  return result;
};

/**
 * 解析日志配置：对缺失字段补充默认值（level → warn，file → LOG_FILE）
 * @param raw 从 readConfig 读取的部分配置，null/undefined 表示完全未配置
 */
export const resolveLoggingConfig = (raw: LoggingConfig | null | undefined): Required<LoggingConfig> => {
  return {
    level: raw?.level ?? 'warn',
    file: raw?.file ?? LOG_FILE
  };
};

/**
 * 解析 company 配置：对缺失字段补充默认值（role.chat.model → deepseek，其余 → 空字符串）
 * @param raw 从 readConfig 读取的 company 段，null/undefined 表示完全未配置
 */
export const resolveCompanyConfig = (raw: CompanyConfig | null | undefined): ResolvedCompanyConfig => {
  const min = raw?.product?.story?.min ?? 2;
  const max = raw?.product?.story?.max ?? 3;
  return {
    role: {
      name: raw?.role?.name ?? '',
      chat: { model: raw?.role?.chat?.model ?? 'deepseek' }
    },
    product: {
      name: raw?.product?.name ?? '',
      story: {
        as: raw?.product?.story?.as ?? '',
        min,
        // min > max 时抬升 max，保证生成条数区间合法
        max: Math.max(min, max)
      }
    },
    description: raw?.description ?? ''
  };
};

/**
 * 解析 task 段：coreSize 和 maxSize 均为可选数字；任一非数字则丢弃整个段
 * 规范化规则：
 * - 若 coreSize > maxSize，则 maxSize = coreSize
 * - maxSize 上限为 128
 */
const parseTaskConfig = (raw: unknown): TaskConfig | undefined => {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const obj = raw as Record<string, unknown>;
  const result: TaskConfig = {};
  let hasValidField = false;

  if (typeof obj.coreSize === 'number') {
    result.coreSize = obj.coreSize;
    hasValidField = true;
  } else if (obj.coreSize !== undefined) {
    // coreSize 存在但非数字 → 丢弃整个段
    return undefined;
  }

  if (typeof obj.maxSize === 'number') {
    result.maxSize = obj.maxSize;
    hasValidField = true;
  } else if (obj.maxSize !== undefined) {
    // maxSize 存在但非数字 → 丢弃整个段
    return undefined;
  }

  if (!hasValidField) {
    return undefined;
  }

  // 规范化：coreSize > maxSize 时 maxSize = coreSize
  if (result.coreSize !== undefined && result.maxSize !== undefined && result.coreSize > result.maxSize) {
    result.maxSize = result.coreSize;
  }

  // 规范化：maxSize 上限 128
  if (result.maxSize !== undefined && result.maxSize > 128) {
    result.maxSize = 128;
  }

  return result;
};

/**
 * 把原始值收窄为对象形式的键值表
 * @param raw 原始值
 * @returns 键值表，非对象时返回 undefined
 */
const asRecord = (raw: unknown): Record<string, unknown> | undefined => {
  return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : undefined;
};

/**
 * 解析 company.role 段：缺失或类型非法的字段丢弃，无有效字段时返回 undefined
 */
const parseCompanyRole = (raw: unknown): CompanyRoleConfig | undefined => {
  const obj = asRecord(raw);
  if (!obj) {
    return undefined;
  }
  const role: CompanyRoleConfig = {};
  if (typeof obj.name === 'string') {
    role.name = obj.name;
  }
  const chat = asRecord(obj.chat);
  if (chat && typeof chat.model === 'string') {
    role.chat = { model: chat.model };
  }
  return Object.keys(role).length > 0 ? role : undefined;
};

/**
 * 解析 company.product.story 段：缺失或类型非法的字段丢弃，无有效字段时返回 undefined
 */
const parseCompanyStory = (raw: unknown): CompanyStoryConfig | undefined => {
  const obj = asRecord(raw);
  if (!obj) {
    return undefined;
  }
  const story: CompanyStoryConfig = {};
  if (typeof obj.as === 'string') {
    story.as = obj.as;
  }
  if (typeof obj.min === 'number') {
    story.min = obj.min;
  }
  if (typeof obj.max === 'number') {
    story.max = obj.max;
  }
  return Object.keys(story).length > 0 ? story : undefined;
};

/**
 * 解析 company.product 段：缺失或类型非法的字段丢弃，无有效字段时返回 undefined
 */
const parseCompanyProduct = (raw: unknown): CompanyProductConfig | undefined => {
  const obj = asRecord(raw);
  if (!obj) {
    return undefined;
  }
  const product: CompanyProductConfig = {};
  if (typeof obj.name === 'string') {
    product.name = obj.name;
  }
  const story = parseCompanyStory(obj.story);
  if (story) {
    product.story = story;
  }
  return Object.keys(product).length > 0 ? product : undefined;
};

/**
 * 解析顶级 company 段：缺失或类型非法的字段丢弃，整段无有效字段时返回 undefined
 */
const parseCompany = (raw: unknown): CompanyConfig | undefined => {
  const obj = asRecord(raw);
  if (!obj) {
    return undefined;
  }
  const result: CompanyConfig = {};
  if (typeof obj.description === 'string') {
    result.description = obj.description;
  }
  const role = parseCompanyRole(obj.role);
  if (role) {
    result.role = role;
  }
  const product = parseCompanyProduct(obj.product);
  if (product) {
    result.product = product;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * 校验并规范化 load 的结果（宽容处理字段缺失，语法错误已在 load 时抛出）
 */
const normalize = (data: unknown): WuhuaConfig => {
  if (typeof data !== 'object' || data === null) {
    return { name: '', hooks: {} };
  }
  const obj = data as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name : '';
  const hooks = parseHooks(obj.hooks);
  const logging = parseLogging(obj.logging);
  const task = parseTaskConfig(obj.task);
  const company = parseCompany(obj.company);
  if (typeof obj.agents !== 'object' || obj.agents === null) {
    return { name, hooks, logging, task, company };
  }

  const agents: Record<string, AgentConfig> = {};
  for (const [agentName, raw] of Object.entries(obj.agents as Record<string, unknown>)) {
    if (typeof raw !== 'object' || raw === null) {
      continue;
    }
    const entry = buildAgentEntry(raw as Record<string, unknown>);
    if (entry) {
      agents[agentName] = entry;
    }
  }

  const result: WuhuaConfig = { name, hooks };
  if (Object.keys(agents).length > 0) {
    result.agents = agents;
  }
  if (logging) {
    result.logging = logging;
  }
  if (task) {
    result.task = task;
  }
  if (company) {
    result.company = company;
  }
  return result;
};

/**
 * 读取配置文件（不存在时返回空配置）
 * @param configPath 配置文件路径（默认 getConfigPath()）
 */
export const readConfig = (configPath?: string): WuhuaConfig => {
  const path = configPath ?? getConfigPath();
  if (!exists(path)) {
    return { name: '' };
  }
  const content = readFile(path);
  if (!content) {
    return { name: '' };
  }

  let parsed: unknown;
  try {
    parsed = load(content);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `无法解析配置文件 ${path}:\n${reason}\n` +
        `请检查 YAML 格式（如键重复、缩进错误），删除重复项后重试，或运行 \`wuhua init\` 重新初始化。`,
      { cause: err }
    );
  }
  return normalize(parsed);
};

/**
 * 写入配置文件
 * @param data 配置数据
 * @param configPath 配置文件路径（默认 getConfigPath()）
 */
export const writeConfig = (data: WuhuaConfig, configPath?: string): void => {
  const path = configPath ?? getConfigPath();
  const dir = dirname(path);
  if (!exists(dir)) {
    ensureDir(dir);
  }
  writeFile(path, dump(data, YAML_DUMP_OPTIONS));
};

/**
 * 检查配置文件是否存在
 * @param configPath 配置文件路径（默认 getConfigPath()）
 */
export const configExists = (configPath?: string): boolean => {
  return exists(configPath ?? getConfigPath());
};
