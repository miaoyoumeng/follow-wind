import type { DecisionContext, DecisionStrategy } from '../types';
import { extractNumberedLines, isContinuousFromOne } from './parser';

/**
 * 策略：权限沙盒检测。
 * 检测 Claude 权限确认 UI 模式：
 * 1. 存在编号选项（至少 2 个），从 1 开始且连续
 * 2. 选项中至少有一个包含 "Yes"，一个包含 "No"
 * 3. 内容包含 "Esc to cancel" 和 "Tab to amend"
 * @param context 决策上下文
 * @returns 匹配时返回 'permissionSandbox'，不匹配返回 null
 */
export const permissionSandbox: DecisionStrategy = (context: DecisionContext): string | null => {
  const { content } = context;

  // 检查固定提示
  if (!content.includes('Esc to cancel') || !content.includes('Tab to amend')) {
    return null;
  }

  // 提取编号行
  const numberedLines = extractNumberedLines(content);
  if (numberedLines.length < 2) {
    return null;
  }

  const numbers = numberedLines.map(nl => nl.num);

  // 编号必须从 1 开始且连续
  if (!isContinuousFromOne(numbers)) {
    return null;
  }

  // 至少有一个选项包含 "Yes"，一个包含 "No"
  const lines = numberedLines.map(nl => nl.line);
  const hasYes = lines.some(l => l.includes('Yes'));
  const hasNo = lines.some(l => l.includes('No'));
  if (!hasYes || !hasNo) {
    return null;
  }

  return 'permissionSandbox';
};
