import { createI18n } from 'vue-i18n';
import { getBrowserLang } from '@/renderer/utils/BrowserUtils.ts';

import zh from './modules/zh';
import en from './modules/en';

const i18n = createI18n({
  // Use Composition API, Set to false
  allowComposition: true,
  locale: getBrowserLang() || 'zh', // 默认使用中文
  fallbackLocale: 'zh', // 设置回退语言为中文
  messages: {
    zh,
    en
  }
});

export enum LangType {
  EN_US = 'en-us',
  ZH_CN = 'zh-cn'
}

export default i18n;
