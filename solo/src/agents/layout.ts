import { splitPane, setPaneTitle, sendKeys } from '../tmux';
import { isValidPanePosition, type AgentPanes, type PanePosition } from '../config';
import type { SplitPlan } from './types';

/**
 * 将 tag-keyed AgentPanes 转为 position-keyed 旧格式（内部复用位置判定逻辑）
 */
const toPositionKeyed = (panes: AgentPanes): Partial<Record<PanePosition, string>> => {
  const result: Partial<Record<PanePosition, string>> = {};
  for (const [tag, entry] of Object.entries(panes)) {
    if (isValidPanePosition(entry.layout)) {
      result[entry.layout] = tag;
    }
  }
  return result;
};

/**
 * 判断位置是否为单值（left/right）
 */
const isSinglePosition = (pos: PanePosition): boolean => {
  return pos === 'left' || pos === 'right';
};

/**
 * 提取位置的行和列信息
 */
const parseRowCol = (pos: PanePosition): { row: 'top' | 'mid' | 'bottom'; col: 'left' | 'right' } => {
  if (pos === 'left') return { row: 'mid', col: 'left' };
  if (pos === 'right') return { row: 'mid', col: 'right' };
  const row = pos.endsWith('-top') ? 'top' : 'bottom';
  const col = pos.startsWith('left-') ? 'left' : 'right';
  return { row, col };
};

/**
 * 按"从左到右，从上到下"计算 pane 视觉顺序
 * 编号规则：先按列（left→right），同列内按行（top→bottom）
 */
const getPaneOrder = (pos: PanePosition): number => {
  const { row, col } = parseRowCol(pos);
  const colOrder = col === 'left' ? 0 : 1;
  const rowOrder = row === 'top' ? 0 : row === 'mid' ? 1 : 2;
  return colOrder * 3 + rowOrder;
};

/**
 * 根据 panes 配置判定分屏方向
 * 内部转为 position-keyed 格式后复用位置判定逻辑
 */
export const resolveSplitAxis = (panes?: AgentPanes): 'h' | 'v' | null => {
  if (!panes) return null;
  const posKeyed = toPositionKeyed(panes);
  const positions = Object.keys(posKeyed).filter((k): k is PanePosition => isValidPanePosition(k));
  if (positions.length === 0) return null;

  if (positions.length === 1) {
    const v = positions[0];
    return v === 'left' || v === 'right' ? 'h' : null;
  }

  const allSingle = positions.every(isSinglePosition);
  const allCompound = positions.every(v => !isSinglePosition(v));
  if (!allSingle && !allCompound) return null;

  const parsed = positions.map(parseRowCol);
  const firstRow = parsed[0].row;
  const firstCol = parsed[0].col;

  if (parsed.every(p => p.row === firstRow)) return 'h';
  if (parsed.every(p => p.col === firstCol)) return 'v';
  return null;
};

/**
 * 解析 3-pane 布局的 split 计划
 * 支持两种模式：
 * - left-split: left + right-top + right-bottom（先 -h，再在 right 上 -v）
 * - right-split: right + left-top + left-bottom（先 -h，再在 left 上 -v）
 */
export const resolveSplitPlan = (panes?: AgentPanes): SplitPlan | null => {
  if (!panes) return null;
  const posKeyed = toPositionKeyed(panes);
  const positions = Object.keys(posKeyed).filter((k): k is PanePosition => isValidPanePosition(k));
  if (positions.length !== 3) return null;

  const posSet = new Set(positions);

  if (posSet.has('left') && posSet.has('right-top') && posSet.has('right-bottom')) {
    return {
      pattern: 'left-split',
      steps: [
        { orientation: '-h', target: 'original' },
        { orientation: '-v', target: 'right' }
      ],
      paneMap: { left: 1, 'right-top': 2, 'right-bottom': 3 }
    };
  }

  if (posSet.has('right') && posSet.has('left-top') && posSet.has('left-bottom')) {
    return {
      pattern: 'right-split',
      steps: [
        { orientation: '-h', target: 'original' },
        { orientation: '-v', target: 'left' }
      ],
      paneMap: { 'left-top': 1, right: 2, 'left-bottom': 3 }
    };
  }

  return null;
};

/**
 * 执行 3-pane split 并返回 position → pane 编号映射
 */
const executeThreePaneSplit = async (
  sessionName: string,
  windowName: string,
  plan: SplitPlan,
  originalPane: number,
  workspace: string
): Promise<Record<string, number>> => {
  const rightPane = await splitPane(sessionName, windowName, originalPane, '-h', workspace);
  if (plan.pattern === 'left-split') {
    const rbPane = await splitPane(sessionName, windowName, rightPane, '-v', workspace);
    return { left: originalPane, 'right-top': rightPane, 'right-bottom': rbPane };
  }
  const lbPane = await splitPane(sessionName, windowName, originalPane, '-v', workspace);
  return { 'left-top': originalPane, 'left-bottom': lbPane, right: rightPane };
};

/**
 * 2-pane：单次 split 并返回 position → pane 编号映射
 */
const buildTwoPaneMap = async (
  sessionName: string,
  windowName: string,
  posKeyed: Partial<Record<PanePosition, string>>,
  axis: 'h' | 'v' | null,
  originalPane: number,
  workspace: string
): Promise<Record<string, number>> => {
  const orientation = axis === 'h' ? '-h' : '-v';
  const newPane = await splitPane(sessionName, windowName, originalPane, orientation, workspace);
  const sorted = (Object.keys(posKeyed) as PanePosition[]).sort((a, b) => getPaneOrder(a) - getPaneOrder(b));
  return { [sorted[0]]: originalPane, [sorted[1]]: newPane };
};

/**
 * 按 config 顺序将 tag 映射到 tmux pane index
 * split 执行后 posToIdx 的 value 已按 tmux 创建顺序（即视觉顺序）编号
 * config 中第 N 个条目直接对应第 N 个位置（按 Object.keys 顺序）的 tmux index
 */
const buildTagMap = (panes: AgentPanes, posToIdx: Record<string, number>): Record<string, number> => {
  const entries = Object.entries(panes);
  const positions = Object.keys(posToIdx);
  const result: Record<string, number> = {};
  for (let i = 0; i < entries.length; i++) {
    result[entries[i][0]] = posToIdx[positions[i]];
  }
  return result;
};

/**
 * 执行 pane 布局：根据 panes 配置执行 split、设置标题、执行 booter 命令
 * pane 编号按 AgentPanes 中的 key 顺序（YAML 书写顺序）确定
 */
export const panesLayout = async (
  sessionName: string,
  windowName: string,
  panes: AgentPanes,
  plan: SplitPlan | null,
  axis: 'h' | 'v' | null,
  originalPane: number,
  workspace: string
): Promise<void> => {
  const paneCount = Object.keys(panes).length;
  const posKeyed = toPositionKeyed(panes);

  let posToIdx: Record<string, number>;
  if (paneCount === 1) {
    const pos = Object.keys(posKeyed)[0];
    posToIdx = { [pos]: originalPane };
  } else if (plan) {
    posToIdx = await executeThreePaneSplit(sessionName, windowName, plan, originalPane, workspace);
  } else {
    posToIdx = await buildTwoPaneMap(sessionName, windowName, posKeyed, axis, originalPane, workspace);
  }

  const tagToIdx = buildTagMap(panes, posToIdx);

  // 设置标题：key 即 tag 名
  for (const [tag, idx] of Object.entries(tagToIdx)) {
    await setPaneTitle(sessionName, windowName, idx, tag);
  }

  // booter 有值的 pane 执行启动命令
  for (const [tag, idx] of Object.entries(tagToIdx)) {
    const entry = panes[tag];
    if (entry?.booter) {
      await sendKeys(sessionName, windowName, idx, entry.booter);
      await sendKeys(sessionName, windowName, idx, 'Enter');
    }
  }
};
