import { type RouteRecordRaw } from 'vue-router';
import { ERROR_400, ERROR_403, ERROR_404, ERROR_500, LAYOUT_FRAMEWORK, MAIN_URL, TO_LOGIN_URL } from '@/routers/config';

/**
 * staticRouter (静态路由)
 */
export const staticRouter: RouteRecordRaw[] = [
  {
    path: TO_LOGIN_URL, //首页
    name: 'toLogin',
    component: () => import('@/pages/login/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: MAIN_URL, // 主页面
    name: 'main',
    // component: () => import('@/pages/main/Desktop.vue'),
    component: () => import('@/layouts/index.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/layout',
    name: LAYOUT_FRAMEWORK,
    component: () => import('@/layouts/index.vue'),
    meta: {
      title: '框架'
    },
    children: []
  }
];

/**
 * errorRouter (错误页面路由)
 */
export const errorRouter = [
  {
    path: ERROR_400,
    name: '400',
    component: () => import('@/views/error/index.vue'),
    meta: {
      title: '400页面'
    }
  },
  {
    path: ERROR_403,
    name: '403',
    component: () => import('@/views/error/index.vue'),
    meta: {
      title: '403页面'
    }
  },
  {
    path: ERROR_404,
    name: '404',
    component: () => import('@/views/error/index.vue'),
    meta: {
      title: '404页面'
    }
  },
  {
    path: ERROR_500,
    name: '500',
    component: () => import('@/views/error/index.vue'),
    meta: {
      title: '500页面'
    }
  },
  {
    // Resolve refresh page, route warnings
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/error/index.vue'),
    meta: {
      title: '404页面'
    }
  }
];
