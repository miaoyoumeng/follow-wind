import { createApp } from 'vue';
import TDesign from 'tdesign-vue-next';

import App from '@/App.vue';

import router from '@/renderer/routers';
import pinia from '@/renderer/stores';
import I18n from '@/renderer/i18n/languages/index';

import errorHandler from '@/renderer/handlers/index.ts';

// 引入组件库的少量全局样式变量
import 'tdesign-vue-next/es/style/index.css';

import '@/assets/styles/globals.scss';
import '@/assets/styles/tdesign.scss';
import '@/assets/styles/common.scss';
import '@/assets/styles/font.scss';

const app = createApp(App);

// @ts-ignore
app.config.errorHandler = errorHandler;

app.use(pinia).use(router).use(TDesign).use(I18n).mount('#app');
