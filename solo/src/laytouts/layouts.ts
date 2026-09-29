import { isEqual } from 'lodash';

import { type AgentPanes } from '../config';
import { logger } from '../logging';
import { LAYOUT_MAP } from './types';

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
