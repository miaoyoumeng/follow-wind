import type { DecisionContext, DecisionStrategy } from '../types';

/** 匹配编号行的正则：可选前导空白 + 可选 ❯/↓ 前缀 + 数字 + 点 */
const NUMBERED_LINE_REGEX = /^\s*(?:[❯↓]\s+)?(\d+)\./;

/** 提取内容中所有编号行的数字序号及对应行内容 */
const extractNumberedLines = (content: string): Array<{ num: number; line: string }> => {
  const result: Array<{ num: number; line: string }> = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(NUMBERED_LINE_REGEX);
    if (match) {
      result.push({ num: Number(match[1]), line });
    }
  }
  return result;
};

/** 检查数字序列是否从 1 开始且连续 */
const isContinuousFromOne = (numbers: number[]): boolean => {
  if (numbers.length === 0 || numbers[0] !== 1) return false;
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) return false;
  }
  return true;
};

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
  if (!content) return null;

  // 检查固定提示
  if (!content.includes('Esc to cancel') || !content.includes('Tab to amend')) {
    return null;
  }

  // 提取编号行
  const numberedLines = extractNumberedLines(content);
  if (numberedLines.length < 2) return null;

  const numbers = numberedLines.map(nl => nl.num);

  // 编号必须从 1 开始且连续
  if (!isContinuousFromOne(numbers)) return null;

  // 至少有一个选项包含 "Yes"，一个包含 "No"
  const lines = numberedLines.map(nl => nl.line);
  const hasYes = lines.some(l => l.includes('Yes'));
  const hasNo = lines.some(l => l.includes('No'));
  if (!hasYes || !hasNo) return null;

  return 'permissionSandbox';
};
