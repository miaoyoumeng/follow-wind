/**
 * @description 获取浏览器默认语言
 * @returns {String} 返回 'zh' 或 'en'
 */
export const getBrowserLang = (): string => {
  // 在 SSR 或某些环境下 navigator 可能不存在
  if (typeof navigator === 'undefined') {
    return 'zh'; // 默认返回中文
  }

  // 获取浏览器语言，兼容不同浏览器
  const browserLang = navigator.language || navigator.languages?.[0] || 'zh-cn';

  if (['cn', 'zh', 'zh-cn', 'zh-tw', 'zh-hans', 'zh-hant'].includes(browserLang.toLowerCase())) {
    return 'zh';
  }
  return 'en';
};
