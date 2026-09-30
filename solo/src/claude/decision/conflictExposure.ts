import type { DecisionContext, DecisionStrategy } from '../types';
import { NUMBERED_LINE_REGEX } from './parser';

/** 冲突/矛盾信号关键词 */
const CONFLICT_KEYWORDS: readonly string[] = ['冲突', 'conflict', '不一致', '矛盾'];

/** 确认信号关键词 */
const CONFIRM_KEYWORDS: readonly string[] = ['确认'];

/**
 * 策略：冲突暴露。
 * 检测到矛盾时暴露给人，不折中。
 * 三条件同时满足才触发：
 * 1. 包含冲突关键词（冲突 / conflict / 不一致 / 矛盾）
 * 2. 包含编号选项（至少 1 行序号）
 * 3. 包含确认关键词（确认）
 * @param context 决策上下文
 * @returns 匹配时返回 'conflictExposure'，不匹配返回 null
 */
export const conflictExposure: DecisionStrategy = (context: DecisionContext): string | null => {
  const { content } = context;

  const hasConflict = CONFLICT_KEYWORDS.some(kw => content.includes(kw));
  if (!hasConflict) {
    return null;
  }

  const hasNumbered = NUMBERED_LINE_REGEX.test(content);
  if (!hasNumbered) {
    return null;
  }

  const hasConfirm = CONFIRM_KEYWORDS.some(kw => content.includes(kw));
  if (!hasConfirm) {
    return null;
  }

  return 'conflictExposure';
};
