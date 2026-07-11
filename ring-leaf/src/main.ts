import { createApp } from 'vue';
import TDesign from 'tdesign-vue-next';
import * as Icons from 'tdesign-icons-vue-next';

// import Login from '@/views/login/Login.vue';
import App from '@/App.vue';

import router from '@/routers';
import pinia from '@/stores';

import errorHandler from '@/utils/handler.ts';

// 引入组件库的少量全局样式变量
import 'tdesign-vue-next/es/style/index.css';

import '@/assets/styles/globals.css';
import '@/assets/styles/common.scss';
import '@/assets/styles/font.scss';

const app = createApp(App);

app.config.errorHandler = errorHandler;

// 使用icons
Object.keys(Icons).forEach(key => {
  app.component(key, Icons[key as keyof typeof Icons]);
});
app.use(pinia).use(router).use(TDesign).mount('#app');
