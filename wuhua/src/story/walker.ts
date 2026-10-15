/**
 * 递归遍历 feature 数据，返回所有叶子节点的路径（形如「用户管理-今日用户」）
 * @param data 待遍历的数据
 * @param prefix 当前已累积的路径前缀，顶层调用时省略
 * @returns 叶子路径列表，顺序与数据书写顺序一致
 */
export const walkFeature = (data: unknown, prefix = ''): string[] => {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      // 空数组没有下级，它自己就是叶子
      return prefix ? [prefix] : [];
    }
    return data.flatMap((value, index) => {
      // 元素本身就是名称（如「今日用户」）时直接用名称，比下标可读；
      // 元素是对象/数组时没有名称可用，只能用下标定位
      const segment = typeof value === 'object' && value !== null ? String(index) : String(value);
      return walkFeature(value, prefix ? `${prefix}-${segment}` : segment);
    });
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      // 空对象同理
      return prefix ? [prefix] : [];
    }
    // 顶层不拼分隔符，避免出现 "-name" 这种前导横线
    return entries.flatMap(([key, value]) => walkFeature(value, prefix ? `${prefix}-${key}` : key));
  }

  // 标量叶子：路径就是 prefix
  // prefix 为空说明顶层直接就是标量，没有名称可用，直接跳过
  return prefix ? [prefix] : [];
};
