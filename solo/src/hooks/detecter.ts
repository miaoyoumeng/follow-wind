import type { DecisionContext } from '../claude';
import { structuredQuestion, permissionSandbox, conflictExposure } from '../claude';

/** 文本策略，按优先级排列 */
const STRATEGIES: readonly ((context: DecisionContext) => string | null)[] = [
  structuredQuestion,
  permissionSandbox,
  conflictExposure
];

/**
 * 检测 Claude 输出是否需要人工介入（责任链模式）。
 * 依次运行策略，返回第一个匹配的策略名称；全不匹配返回 null。
 * @param context 决策上下文
 * @returns 匹配的策略名称（如 'structuredQuestion'），或 null
 */
export function detectIntervention(context: DecisionContext): string | null {
  for (const strategy of STRATEGIES) {
    const name = strategy(context);
    if (name !== null) {
      return name;
    }
  }
  return null;
}
