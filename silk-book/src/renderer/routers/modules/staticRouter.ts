import { RouteRecordRaw } from 'vue-router';

import Home from '@/renderer/layouts/index.vue';
import Main from '@/renderer/pages/home/index.vue';
import Gitbook from '@/renderer/pages/gitbook/index.vue';
/**
 * staticRouter (静态路由)
 */
export const staticRouter: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      {
        path: '/',
        name: 'Main',
        component: Main
      },
      {
        path: '/gitbook',
        name: 'Gitbook',
        component: Gitbook
      }
    ]
  }
];

/**
 * errorRouter (错误页面路由)
 */
export const errorRouter: RouteRecordRaw[] = [];
