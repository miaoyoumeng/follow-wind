import { Component } from 'vue';
import { RouteRecordRaw } from 'vue-router';

import { NotifyPlugin } from 'tdesign-vue-next';
import router from '@/routers/index';
import { useAuthStore } from '@/stores/modules/auth.ts';
import { logout } from '@/api/login.ts';
import { LAYOUT_FRAMEWORK, TO_LOGIN_URL } from '@/routers/config.ts';
// import HomeIndex from '@/views/home/index.vue';

const appId = import.meta.env.VITE_GLOB_APP_ID as number;
const modules: Record<string, Component> = import.meta.glob('@/views/**/*.vue', { import: 'default', eager: true });
/**
 * @description 初始化动态路由
 */
export const initDynamicRouter = async () => {
  const authStore = useAuthStore();
  try {
    // 1.获取有权限的访问路由列表
    await authStore.getRouterList(appId);
    if (!authStore.authRouterList.length) {
      await NotifyPlugin.warning({
        title: '无权限访问',
        content: '当前账号无任何菜单权限，请联系系统管理员！',
        duration: 3000
      });
      await logout();
      return Promise.reject('No permission');
    }
    // 3.添加动态路由
    authStore.authRouterList.forEach((route: RouteRecordRaw) => {
      const componentType = typeof route.component;
      if (route && route.path && 'string' == componentType) {
        const newRoute: RouteRecordRaw = { ...route };
        newRoute.component = modules['/src/views' + route.component + '.vue'];
        router.addRoute(LAYOUT_FRAMEWORK, newRoute);
      }
    });
  } catch (error) {
    // 当按钮 || 菜单请求出错时，重定向到登陆页
    await router.replace(TO_LOGIN_URL);
    return Promise.reject(error);
  }
};

////////////// 私有方法 //////////////
/**
 * @description 加载动态路由
 */
export const loadDynamicRouters = async () => {
  const authStore = useAuthStore();
  authStore.authRouterList.forEach((route: RouteRecordRaw) => {
    if (route && route.name && route.path) {
      if (!router.hasRoute(route.name) && !route.redirect) {
        const newRoute: RouteRecordRaw = { ...route };
        newRoute.component = modules['/src/views' + route.component + '.vue'];
        // newRoute.component = HomeIndex;
        router.addRoute(LAYOUT_FRAMEWORK, newRoute);
      }
    }
  });
};
