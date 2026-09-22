// import type { DecisionContext, DecisionStrategy } from '../types';
//
// /** 决策信号关键词：内容中出现这些词时才激活分类器 */
// const DECISION_SIGNALS: readonly string[] = ['选择', '决定', '方案', '决策', '是否', '建议', '操作', '执行'];
//
// /**
//  * 检查内容是否包含决策信号
//  * @param content 待检查文本
//  */
// const hasDecisionSignal = (content: string): boolean => {
//   return DECISION_SIGNALS.some(kw => content.includes(kw));
// };
//
// /**
//  * 策略 3：决策分类器。
//  * 四维判断：有约定？可逆？冲突？有上下文？
//  * 仅在内容含决策信号或提供了元数据时激活；任一维度不满足 → 需要人工介入。
//  * @param context 决策上下文
//  * @returns 匹配时返回 'decisionClassifier'，不匹配返回 null
//  */
// export const decisionClassifier: DecisionStrategy = (context: DecisionContext): string | null => {
//   const meta = context.metadata;
//
//   // 无四维元数据且内容无决策信号 → 不激活（避免误报）
//   const hasDimensionMeta =
//     meta?.hasConvention !== undefined ||
//     meta?.isReversible !== undefined ||
//     meta?.hasConflict !== undefined ||
//     meta?.hasContext !== undefined;
//
//   if (!hasDimensionMeta && !hasDecisionSignal(context.content)) {
//     return null;
//   }
//
//   const hasConvention = meta?.hasConvention ?? false;
//   const isReversible = meta?.isReversible ?? false;
//   const hasConflict = meta?.hasConflict ?? false;
//   const hasContext = meta?.hasContext ?? false;
//
//   // 四维全满足才不需要人工介入
//   if (hasConvention && isReversible && !hasConflict && hasContext) {
//     return null;
//   }
//
//   return 'decisionClassifier';
// };
