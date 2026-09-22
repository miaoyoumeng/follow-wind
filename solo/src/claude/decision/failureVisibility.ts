// import type { DecisionContext, DecisionStrategy } from '../types';
//
// /** 错误被吞掉/静默处理的信号关键词 */
// const ERROR_SWALLOW_KEYWORDS: readonly string[] = [
//   '忽略此错误',
//   '忽略错误',
//   '静默跳过',
//   '默认成功',
//   '吞掉',
//   '不需要报告',
//   '无需上报',
//   '悄悄失败'
// ];
//
// /**
//  * 策略 6：失败显性化。
//  * 错误必须抛出/返回/上报，不吞掉。默认成功、静默跳过 → 需要人工介入。
//  * @param context 决策上下文
//  * @returns 匹配时返回 'failureVisibility'，不匹配返回 null
//  */
// export const failureVisibility: DecisionStrategy = (context: DecisionContext): string | null => {
//   const hit = ERROR_SWALLOW_KEYWORDS.find(kw => context.content.includes(kw));
//   if (hit) {
//     return 'failureVisibility';
//   }
//   return null;
// };
