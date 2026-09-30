/** 匹配编号行的正则：可选前导空白 + 可选 ❯/↓ 前缀 + 数字 + 点 */
export const NUMBERED_LINE_REGEX = /^\s*(?:[❯↓]\s+)?(\d+)\./m;

/** 提取内容中所有编号行的数字序号及对应行内容 */
export const extractNumberedLines = (content: string): Array<{ num: number; line: string }> => {
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
export const isContinuousFromOne = (numbers: number[]): boolean => {
  if (numbers.length === 0 || numbers[0] !== 1) {
    return false;
  }
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) {
      return false;
    }
  }
  return true;
};
