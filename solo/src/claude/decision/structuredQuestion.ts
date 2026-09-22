import type { DecisionContext, DecisionStrategy } from '../types';

/** 匹配编号行的正则：可选前导空白 + 可选 ❯/↓ 前缀 + 数字 + 点 */
const NUMBERED_LINE_REGEX = /^\s*(?:[❯↓]\s+)?(\d+)\./m;

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

/** 检查数字序列是否有跳跃（不连续） */
const hasGap = (numbers: number[]): boolean => {
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) return true;
  }
  return false;
};

/**
 * 策略：结构化提问检测。
 * 检测 Claude 结构化 UI 模式：
 * 1. 存在编号选项（至少 2 个）
 * 2. 编号从 1 开始
 * 3. 最后一个编号项包含 "Chat about this"
 * 4. 如果末尾两项编号相同（如都是 5），则都视为提示项；否则检查倒数第二项是否是 "Type something"
 * 5. 如果编号有跳跃（如 4→6），"Type something" 可选；否则必须有 "Type something"
 * @param context 决策上下文
 * @returns 匹配时返回 'structuredQuestion'，不匹配返回 null
 */
export const structuredQuestion: DecisionStrategy = (context: DecisionContext): string | null => {
  const numberedLines = extractNumberedLines(context.content);
  if (numberedLines.length < 2) return null;

  const numbers = numberedLines.map(nl => nl.num);

  // 最后一个编号项必须包含 "Chat about this"
  const lastEntry = numberedLines[numberedLines.length - 1];
  if (!lastEntry.line.includes('Chat about this')) return null;

  // 检查倒数第二项
  const secondLastEntry = numberedLines[numberedLines.length - 2];
  const hasTypeSomething = secondLastEntry.line.includes('Type something');

  // 检查末尾两项是否编号相同（如都是 5）
  const lastTwoHaveSameNumber = secondLastEntry.num === lastEntry.num;

  // 根据完整编号序列是否有跳跃决定 "Type something" 是否必需
  const hasNumberGap = hasGap(numbers);

  // 如果末尾两项编号相同，则都视为提示项，检查前面的编号
  const numbersBeforePrompts = lastTwoHaveSameNumber ? numbers.slice(0, -2) : numbers.slice(0, -1);

  if (!hasNumberGap && !hasTypeSomething && !lastTwoHaveSameNumber) {
    // 无跳跃、无重复编号、且缺少 "Type something" → 不匹配
    return null;
  }

  // 检查编号（排除末尾提示项）是否从 1 开始且连续
  if (!isContinuousFromOne(numbersBeforePrompts)) return null;

  return 'structuredQuestion';
};
