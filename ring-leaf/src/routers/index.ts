import { createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/modules/user';
import { useAuthStore } from '@/stores/modules/auth';
import { initDynamicRouter, loadDynamicRouters } from '@/routers/modules/dynamicRouter';
import { staticRouter, errorRouter } from '@/routers/modules/staticRouter';

import { RouteMode } from '@/typings/global';
import { HOME_URL, ROUTER_WHITE_LIST, TO_LOGIN_URL } from '@/routers/config.ts';

const mode: RouteMode = import.meta.env.VITE_ROUTER_MODE;

const routerMode = {
  hash: () => createWebHashHistory(),
  history: () => createWebHistory()
};

/**
 * @description 📚 路由参数配置简介
 * @param path ==> 路由菜单访问路径
 * @param name ==> 路由 name (对应页面组件 name, 可用作 KeepAlive 缓存标识 && 按钮权限筛选)
 * @param redirect ==> 路由重定向地址
 * @param component ==> 视图文件路径
 * @param meta ==> 路由菜单元信息
 * @param meta.icon ==> 菜单和面包屑对应的图标
 * @param meta.title ==> 路由标题 (用作 document.title || 菜单的名称)
 * @param meta.activeMenu ==> 当前路由为详情页时，需要高亮的菜单
 * @param meta.isLink ==> 路由外链时填写的访问地址
 * @param meta.isHide ==> 是否在菜单中隐藏 (通常列表详情页需要隐藏)
 * @param meta.isFull ==> 菜单是否全屏 (示例：数据大屏页面)
 * @param meta.isAffix ==> 菜单是否固定在标签页中 (首页通常是固定的)
 * @param meta.isKeepAlive ==> 当前路由是否缓存
 * */
const router = createRouter({
  history: routerMode[mode](),
  routes: [...staticRouter, ...errorRouter],
  strict: false,
  scrollBehavior: () => ({ left: 0, top: 0 })
});

// router.onReady(() => {
//   console.log('onReady: ');
// });
/**
 * @description 路由拦截 beforeEach
 **/
router.beforeEach(async (to, from, next) => {
  console.log('from: ' + from.fullPath + ', to:' + to.fullPath);

  // 1. 判断是否在路由白名单地址(静态路由)中，如果存在直接放行
  if (ROUTER_WHITE_LIST.includes(to.path)) return next();

  const userStore = useUserStore();
  const authStore = useAuthStore();
  // 2. 跳转到登录页，如果原来有token 就直接登录
  if (to.path.toLocaleLowerCase() === TO_LOGIN_URL) {
    //如果有token, 则跳转到原来页面
    if (userStore.token) return next(from.fullPath);
    clearDynamicRouter();
    return next();
  }

  // 5.判断是否有 Token，没有重定向到 login 页面
  if (!userStore.token) return next({ path: TO_LOGIN_URL, replace: true });
  // 6. 加载动态路由
  if (!authStore.authRouterList.length) {
    await initDynamicRouter();
    return next({ ...to, replace: true });
  } else if (from.path === HOME_URL && to.path != HOME_URL && to.fullPath != to.redirectedFrom?.fullPath) {
    //刷新的时候需要重新加载动态路由
    await loadDynamicRouters();
    return next({ ...to, replace: true });
  }
  // 8.正常访问页面
  next();
});

/**
 * @description 路由跳转错误
 * */
router.onError(error => {
  console.warn('路由错误', error.message);
});

/**
 * @description 重置路由
 * */
const clearDynamicRouter = () => {
  const authStore = useAuthStore();
  if (!authStore.authRouterList.length) {
    authStore.authRouterList.forEach((route: RouteRecordRaw) => {
      const { name } = route;
      if (name && router.hasRoute(name)) router.removeRoute(name);
    });
  }
};

export default router;
