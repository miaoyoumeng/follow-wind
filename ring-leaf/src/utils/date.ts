/**
 * 生成与 mock 数据格式一致的 "YYYY-MM-DD HH:mm:ss" 时间戳。
 * 用于 mock API 在做增删改时写入时间字段（createdAt / updatedAt / cancelledTime 等）。
 */
export const formatNow = (): string => {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${date} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};
