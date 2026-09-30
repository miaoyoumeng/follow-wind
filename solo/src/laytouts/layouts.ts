import { isEqual } from 'lodash';

import { type AgentPanes } from '../config';
import { splitPane } from '../tmux';
import { logger } from '../logging';
import { LAYOUT_MAP, type PaneEntries } from './types';

/**
 * 校验单个 agent 的 panes 配置，返回匹配到的布局名称
 * @param panes agent 的 pane 配置
 * @returns 匹配到的布局名称，未匹配或空配置返回 undefined
 */
export const getAgentPanesLayout = (panes: AgentPanes): string | undefined => {
  const entries = Object.entries(panes);
  if (entries.length === 0) {
    return undefined;
  }

  const positions = new Set(entries.map(([, e]) => e.layout));

  for (const [name, layoutPositions] of Object.entries(LAYOUT_MAP)) {
    if (isEqual(positions, layoutPositions)) {
      logger.debug(`[layouts] agent panes 匹配到布局: ${name}`);
      return name;
    }
  }

  return undefined;
};

/**
 * 执行双 pane 分屏，返回 position → pane index 映射
 * @param s tmux session 名称
 * @param w tmux window 名称
 * @param entries pane 配置条目数组
 * @param orig 原 pane index
 * @param dir 工作目录
 * @param flag 分屏方向（'-h' 左右 / '-v' 上下）
 * @param orderMap 位置 → 排序权重映射（决定分屏后原 pane 与新 pane 的归属顺序）
 */
export const applyTwoPaneSplit = async (
  s: string,
  w: string,
  entries: PaneEntries,
  orig: number,
  dir: string,
  flag: '-h' | '-v',
  orderMap: Record<string, number>
): Promise<Record<string, number>> => {
  const np = await splitPane(s, w, orig, flag, dir);
  const sorted = [...entries].sort(([, a], [, b]) => {
    return (orderMap[a.layout] ?? 0) - (orderMap[b.layout] ?? 0);
  });
  return { [sorted[0][1].layout]: orig, [sorted[1][1].layout]: np };
};

/**
 * 执行三 pane 分屏（left-split 或 right-split），返回 position → pane index 映射
 */
export const applyThreePaneSplit = async (
  s: string,
  w: string,
  layout: string,
  orig: number,
  dir: string
): Promise<Record<string, number>> => {
  const rp = await splitPane(s, w, orig, '-h', dir);
  if (layout === 'LeftThreePane') {
    const rb = await splitPane(s, w, rp, '-v', dir);
    return { left: orig, 'right-top': rp, 'right-bottom': rb };
  }
  const lb = await splitPane(s, w, orig, '-v', dir);
  return { 'left-top': orig, 'left-bottom': lb, right: rp };
};
