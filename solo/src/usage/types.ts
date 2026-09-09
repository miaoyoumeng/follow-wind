/** 单日 token 消耗统计 */
export interface UsageTotals {
  input_cached: number;
  input_missed: number;
  output_missed: number;
}

/** 按日期索引的 usage 统计 */
export type UsageData = Record<string, UsageTotals>;
