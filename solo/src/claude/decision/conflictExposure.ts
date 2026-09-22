// import type { DecisionContext, DecisionStrategy } from '../types';
//
// /** 矛盾/冲突信号关键词 */
// const CONFLICT_KEYWORDS: readonly string[] = [
//   '矛盾',
//   '冲突',
//   '不一致',
//   '两种方案',
//   '互相矛盾',
//   '无法同时',
//   '二者不可兼得',
//   '存在分歧'
// ];
//
// /**
//  * 策略 5：冲突暴露。
//  * 检测到矛盾时暴露给人，不折中。
//  * @param context 决策上下文
//  * @returns 匹配时返回 'conflictExposure'，不匹配返回 null
//  */
// export const conflictExposure: DecisionStrategy = (context: DecisionContext): string | null => {
//   const hit = CONFLICT_KEYWORDS.find(kw => context.content.includes(kw));
//   if (hit) {
//     return 'conflictExposure';
//   }
//   return null;
// };
