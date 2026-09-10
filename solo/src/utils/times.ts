/**
 * 时间工具函数：提供三种格式化输出
 */

/**
 * 将数字补零为两位字符串
 * @param n 数字
 */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * UTC 紧凑格式：YYYYMMDDTHHmmss（例：20260909T103045）
 */
export const formatUtcCompact = (d: Date = new Date()): string => {
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}`;
};

/**
 * 本地紧凑格式：YYYYMMDD-HHmmss（例：20260909-103045）
 */
export const formatLocalCompact = (d: Date = new Date()): string => {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
};

/**
 * 本地可读格式：YYYY-MM-DD HH:mm:ss（例：2026-09-09 10:30:45）
 */
export const formatLocalReadable = (d: Date = new Date()): string => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

/**
 * 仅日期格式：YYYY-MM-DD（例：2026-09-09）
 */
export const formatDateOnly = (d: Date = new Date()): string => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
