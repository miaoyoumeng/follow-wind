import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dump, load } from 'js-yaml';
import { CONFIG_PATH, SOLO_DIR } from '../../config';
import type { PanePosition, AgentPanes, AgentConfig, SoloConfig } from './types';

export type { PanePosition, AgentPanes, AgentConfig, SoloConfig } from './types';

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
 * 解析 panes 对象，过滤非法 key 和非字符串 value
 */
const parsePanes = (rawPanes: Record<string, unknown>): AgentPanes | undefined => {
  const panes: AgentPanes = {};
  for (const [pos, tag] of Object.entries(rawPanes)) {
    if (isValidPanePosition(pos) && typeof tag === 'string') {
      panes[pos as PanePosition] = tag;
    }
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
  if (typeof raw.panes === 'object' && raw.panes !== null) {
    const panes = parsePanes(raw.panes as Record<string, unknown>);
    if (panes) entry.panes = panes;
  }
  return entry;
};

/**
 * 校验并规范化 load 的结果（宽容处理字段缺失，语法错误已在 load 时抛出）
 */
const normalize = (data: unknown): SoloConfig => {
  if (typeof data !== 'object' || data === null) return { name: '' };
  const obj = data as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name : '';
  if (typeof obj.agents !== 'object' || obj.agents === null) return { name };

  const agents: Record<string, AgentConfig> = {};
  for (const [agentName, raw] of Object.entries(obj.agents as Record<string, unknown>)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const entry = buildAgentEntry(raw as Record<string, unknown>);
    if (entry) agents[agentName] = entry;
  }

  return Object.keys(agents).length > 0 ? { name, agents } : { name };
};

/**
 * 读取配置文件（不存在时返回空配置）
 */
export const readConfig = (): SoloConfig => {
  if (!existsSync(CONFIG_PATH)) {
    return { name: '' };
  }
  const content = readFileSync(CONFIG_PATH, 'utf-8');

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
  if (!existsSync(SOLO_DIR)) {
    mkdirSync(SOLO_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, dump(data, YAML_DUMP_OPTIONS), 'utf-8');
};

/**
 * 检查配置文件是否存在
 */
export const configExists = (): boolean => {
  return existsSync(CONFIG_PATH);
};
