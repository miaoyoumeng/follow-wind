import { dump, load } from 'js-yaml';
import { CONFIG_PATH, SOLO_DIR } from '..';
import { exists, ensureDir, readFile, writeFile } from '../../utils';
import type { PanePosition, PaneEntry, AgentPanes, AgentConfig, SoloConfig, LoggingConfig, TaskConfig } from './types';

export type { PanePosition, PaneEntry, AgentPanes, AgentConfig, SoloConfig, LoggingConfig, TaskConfig } from './types';

// dump 选项：与示例保持一致缩进
const YAML_DUMP_OPTIONS = { indent: 4 } as const;

// 允许的 pane 位置值
const VALID_PANE_POSITIONS: ReadonlySet<string> = new Set(['left', 'right', 'left-top', 'right-top', 'left-bottom', 'right-bottom']);

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
const parsePanes = (rawPanes: Record<string, unknown>): AgentPanes | undefined => {
  const panes: AgentPanes = {};
  for (const [tag, raw] of Object.entries(rawPanes)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const entry = raw as Record<string, unknown>;
    if (!isValidPanePosition(entry.layout)) continue;
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
  if (typeof raw.workspace !== 'string') return null;
  const entry: AgentConfig = { workspace: raw.workspace };
  if (typeof raw.activate === 'boolean') entry.activate = raw.activate;
  if (typeof raw.waitTime === 'number') entry.waitTime = raw.waitTime;
  if (typeof raw.panes === 'object' && raw.panes !== null) {
    const panes = parsePanes(raw.panes as Record<string, unknown>);
    if (panes) entry.panes = panes;
  }
  return entry;
};

/**
 * 解析顶级 hooks 段：仅保留 boolean 值条目（事件名 → 启用状态）
 */
const parseHooks = (raw: unknown): Record<string, boolean> => {
  if (typeof raw !== 'object' || raw === null) return {};
  const hooks: Record<string, boolean> = {};
  for (const [event, enabled] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof enabled === 'boolean') hooks[event] = enabled;
  }
  return hooks;
};

/**
 * 解析顶级 logging 段：level 和 file 均为必填字符串，任一缺失则返回 undefined
 */
const parseLogging = (raw: unknown): LoggingConfig | undefined => {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.level !== 'string' || typeof obj.file !== 'string') return undefined;
  return { level: obj.level as LoggingConfig['level'], file: obj.file };
};

/**
 * 解析 task 段：coreSize 和 maxSize 均为可选数字；任一非数字则丢弃整个段
 * 规范化规则：
 * - 若 coreSize > maxSize，则 maxSize = coreSize
 * - maxSize 上限为 128
 */
const parseTaskConfig = (raw: unknown): TaskConfig | undefined => {
  if (typeof raw !== 'object' || raw === null) return undefined;
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

  if (!hasValidField) return undefined;

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
 * 校验并规范化 load 的结果（宽容处理字段缺失，语法错误已在 load 时抛出）
 */
const normalize = (data: unknown): SoloConfig => {
  if (typeof data !== 'object' || data === null) return { name: '', hooks: {} };
  const obj = data as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name : '';
  const hooks = parseHooks(obj.hooks);
  const logging = parseLogging(obj.logging);
  const task = parseTaskConfig(obj.task);
  if (typeof obj.agents !== 'object' || obj.agents === null) return { name, hooks, logging, task };

  const agents: Record<string, AgentConfig> = {};
  for (const [agentName, raw] of Object.entries(obj.agents as Record<string, unknown>)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const entry = buildAgentEntry(raw as Record<string, unknown>);
    if (entry) agents[agentName] = entry;
  }

  const result: SoloConfig = { name, hooks };
  if (Object.keys(agents).length > 0) result.agents = agents;
  if (logging) result.logging = logging;
  if (task) result.task = task;
  return result;
};

/**
 * 读取配置文件（不存在时返回空配置）
 */
export const readConfig = (): SoloConfig => {
  if (!exists(CONFIG_PATH)) {
    return { name: '', hooks: {} };
  }
  const content = readFile(CONFIG_PATH);
  if (!content) {
    return { name: '', hooks: {} };
  }

  let parsed: unknown;
  try {
    parsed = load(content);
  } catch (err) {
    // 解析失败（语法错误、重复键等）：包装为可读的错误信息
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `无法解析配置文件 ${CONFIG_PATH}:\n${reason}\n` + `请检查 YAML 格式（如键重复、缩进错误），删除重复项后重试，或运行 \`solo init\` 重新初始化。`,
      { cause: err }
    );
  }
  return normalize(parsed);
};

/**
 * 写入配置文件
 */
export const writeConfig = (data: SoloConfig): void => {
  if (!exists(SOLO_DIR)) {
    ensureDir(SOLO_DIR);
  }
  writeFile(CONFIG_PATH, dump(data, YAML_DUMP_OPTIONS));
};

/**
 * 检查配置文件是否存在
 */
export const configExists = (): boolean => {
  return exists(CONFIG_PATH);
};
