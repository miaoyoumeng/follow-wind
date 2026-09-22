// import type { DecisionContext, DecisionStrategy } from '../types';
//
// /** 复杂度超阈值信号词 */
// const COMPLEXITY_KEYWORDS: readonly string[] = [
//   '需要多步',
//   '涉及多个文件',
//   '协调修改',
//   '逐步确认',
//   '多步骤任务',
//   '大规模重构',
//   '跨模块',
//   '需要全面评估'
// ];
//
// /** 有序列表项正则：匹配 "1." / "1." / "- " 等 */
// const LIST_ITEM_PATTERN = /(?:^|\n)\s*(?:\d+[.、]|\-\s|\*\s)/g;
//
// /** 触发计划模式的最低步骤数 */
// const COMPLEXITY_THRESHOLD = 3;
//
// /**
//  * 策略 4：计划-确认-执行。
//  * 复杂度超阈值（步骤数 ≥ 3 或命中复杂度关键词）时自动进入计划模式。
//  * @param context 决策上下文
//  * @returns 匹配时返回 'planConfirmExecute'，不匹配返回 null
//  */
// export const planConfirmExecute: DecisionStrategy = (context: DecisionContext): string | null => {
//   const { content } = context;
//
//   // 检查复杂度关键词
//   const hitKeyword = COMPLEXITY_KEYWORDS.find(kw => content.includes(kw));
//   if (hitKeyword) {
//     return 'planConfirmExecute';
//   }
//
//   // 检查步骤数
//   const steps = content.match(LIST_ITEM_PATTERN);
//   if (steps && steps.length >= COMPLEXITY_THRESHOLD) {
//     return 'planConfirmExecute';
//   }
//
//   return null;
// };
