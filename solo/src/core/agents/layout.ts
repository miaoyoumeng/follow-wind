import { splitPane, setPaneTitle } from '../../tmux';
import { startClaude } from '../../claude';
import { isValidPanePosition, type AgentPanes, type PanePosition } from '../yaml';
import type { SplitPlan } from './types';

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
 * 根据 panes 判定分屏方向（位置来自 keys）
 * - 同行（所有 row 相同）→ 'h'
 * - 同列（所有 col 相同）→ 'v'
 * - 混合单值和复合值 → null（语义不兼容）
 * - 对角线 → null
 * - 单 key left/right → 'h'，单复合 key → null
 */
export const resolveSplitAxis = (panes?: AgentPanes): 'h' | 'v' | null => {
  if (!panes) return null;
  // keys 即位置
  const positions = Object.keys(panes).filter((k): k is PanePosition => isValidPanePosition(k));
  if (positions.length === 0) return null;

  // 单值特例
  if (positions.length === 1) {
    const v = positions[0];
    return v === 'left' || v === 'right' ? 'h' : null;
  }

  // 混合单值和复合值 → null
  const allSingle = positions.every(isSinglePosition);
  const allCompound = positions.every(v => !isSinglePosition(v));
  if (!allSingle && !allCompound) return null;

  const parsed = positions.map(parseRowCol);
  const firstRow = parsed[0].row;
  const firstCol = parsed[0].col;

  // 同行 → h
  if (parsed.every(p => p.row === firstRow)) return 'h';
  // 同列 → v
  if (parsed.every(p => p.col === firstCol)) return 'v';
  // 对角线 → null
  return null;
};

/**
 * 按"从左到右，从上到下"计算 pane 编号顺序
 * 编号规则：先按列（left→right），同列内按行（top→bottom）
 */
const getPaneOrder = (pos: PanePosition): number => {
  const { row, col } = parseRowCol(pos);
  const colOrder = col === 'left' ? 0 : 1;
  const rowOrder = row === 'top' ? 0 : row === 'mid' ? 1 : 2;
  return colOrder * 3 + rowOrder;
};

/**
 * 解析 3-pane 布局的 split 计划
 * 支持两种模式：
 * - left-split: left + right-top + right-bottom（先 -h，再在 right 上 -v）
 * - right-split: right + left-top + left-bottom（先 -h，再在 left 上 -v）
 * 其他组合或 2-pane/4-pane → null
 */
export const resolveSplitPlan = (panes?: AgentPanes): SplitPlan | null => {
  if (!panes) return null;
  const positions = Object.keys(panes).filter((k): k is PanePosition => isValidPanePosition(k));
  if (positions.length !== 3) return null; // 只支持 3 panes

  const posSet = new Set(positions);

  // 模式 A：left + right-top + right-bottom
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

  // 模式 B：right + left-top + left-bottom
  if (posSet.has('right') && posSet.has('left-top') && posSet.has('left-bottom')) {
    return {
      pattern: 'right-split',
      steps: [
        { orientation: '-h', target: 'original' },
        { orientation: '-v', target: 'left' }
      ],
      // 实际 pane 编号：
      // Step 1: split -h → left(1), right(2)
      // Step 2: split -v at left(1) → left-top(1), left-bottom(3)
      // 最终：left-top=1, right=2, left-bottom=3
      paneMap: { 'left-top': 1, right: 2, 'left-bottom': 3 }
    };
  }

  return null;
};

/**
 * 执行 3-pane split 并返回 position → pane 编号映射
 */
const executeThreePaneSplit = async (
  targetBase: string,
  panes: AgentPanes,
  plan: SplitPlan,
  originalPane: number,
  workspace: string
): Promise<Record<string, number>> => {
  const rightPane = await splitPane(`${targetBase}.${originalPane}`, '-h', workspace);
  if (plan.pattern === 'left-split') {
    const rbPane = await splitPane(`${targetBase}.${rightPane}`, '-v', workspace);
    return { left: originalPane, 'right-top': rightPane, 'right-bottom': rbPane };
  }
  const lbPane = await splitPane(`${targetBase}.${originalPane}`, '-v', workspace);
  return { 'left-top': originalPane, 'left-bottom': lbPane, right: rightPane };
};

/**
 * 2-pane：单次 split 并返回 position → pane 编号映射
 */
const buildTwoPaneMap = async (
  targetBase: string,
  panes: AgentPanes,
  axis: 'h' | 'v' | null,
  originalPane: number,
  workspace: string
): Promise<Record<string, number>> => {
  const orientation = axis === 'h' ? '-h' : '-v';
  const newPane = await splitPane(`${targetBase}.${originalPane}`, orientation, workspace);
  const sorted = (Object.keys(panes) as PanePosition[]).sort((a, b) => getPaneOrder(a) - getPaneOrder(b));
  return { [sorted[0]]: originalPane, [sorted[1]]: newPane };
};

/**
 * 为所有 pane 设置标题
 */
const setPaneTitles = async (targetBase: string, panes: AgentPanes, map: Record<string, number>): Promise<void> => {
  for (const [pos, tag] of Object.entries(panes)) {
    const paneIdx = map[pos];
    if (paneIdx !== undefined) await setPaneTitle(`${targetBase}.${paneIdx}`, tag);
  }
};

/**
 * 在 tag === 'claude' 的 pane 中启动 claude
 */
const launchClaudePanes = async (targetBase: string, panes: AgentPanes, map: Record<string, number>): Promise<void> => {
  for (const [pos, tag] of Object.entries(panes)) {
    if (tag === 'claude') {
      const paneIdx = map[pos];
      if (paneIdx !== undefined) await startClaude(`${targetBase}.${paneIdx}`);
    }
  }
};

/**
 * 执行 pane 布局：根据 panes 配置执行 split、设置标题、启动 claude
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
  const targetBase = `${sessionName}:${windowName}`;
  const map: Record<string, number> =
    paneCount === 1
      ? { [Object.keys(panes)[0]]: originalPane }
      : plan
        ? await executeThreePaneSplit(targetBase, panes, plan, originalPane, workspace)
        : await buildTwoPaneMap(targetBase, panes, axis, originalPane, workspace);
  await setPaneTitles(targetBase, panes, map);
  await launchClaudePanes(targetBase, panes, map);
};
