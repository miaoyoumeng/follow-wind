/**
 * 把任意值转成提示文案里的中文类型名称
 * @param value 待描述的值
 * @returns 类型的中文名称
 */
const typeName = (value: unknown): string => {
  if (value === null) {
    return '空值（null）';
  }
  if (typeof value === 'boolean') {
    return '布尔值';
  }
  if (Array.isArray(value)) {
    return '数组';
  }
  if (typeof value === 'string') {
    return '字符串';
  }
  if (typeof value === 'number') {
    return '数字';
  }
  if (typeof value === 'object') {
    return '对象';
  }
  return '未知类型';
};

/**
 * 校验 feature 数据是否为标准格式：顶层是对象，每个键对应一个字符串数组
 * @param data 已解析的 feature 数据
 * @returns 全部格式问题的描述列表，格式合法时为空数组
 */
export const validateFeatureFormat = (data: unknown): string[] => {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push(`顶层应为对象（{}），实际是${typeName(data)}。`);
    return errors;
  }

  for (const [key, value] of Object.entries(data)) {
    if (!Array.isArray(value)) {
      errors.push(`「${key}」的值应为数组（[]），实际是${typeName(value)}。`);
      continue;
    }
    value.forEach((item, index) => {
      if (typeof item !== 'string') {
        errors.push(`「${key}」的第 ${index + 1} 项应为字符串，实际是${typeName(item)}。`);
      }
    });
  }

  return errors;
};
