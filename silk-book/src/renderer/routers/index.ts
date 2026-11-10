import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import { staticRouter, errorRouter } from '@/renderer/routers/modules/staticRouter';

import { RouteMode } from '@/typings/global';
import { ROUTER_WHITE_LIST } from '@/renderer/routers/config.ts';

const mode: RouteMode = import.meta.env.VITE_ROUTER_MODE;
const VITE_HOME_INDEX_URI: string = import.meta.env.VITE_HOME_INDEX_URI;

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

/**
 * @description 路由拦截 beforeEach
 **/
router.beforeEach(async (to, from, next) => {
  console.log('from: ' + from.fullPath + ', to:' + to.fullPath);

  // 1. 判断是否在路由白名单地址(静态路由)中，如果存在直接放行
  if (ROUTER_WHITE_LIST.includes(to.path)) return next();

  // 2. 跳转到首页
  if (to.path.toLocaleLowerCase() === VITE_HOME_INDEX_URI) {
    //如果有token, 则跳转到原来页面
    return next();
  }

  // 5.判断是否有 Token，没有重定向到 login 页面
  // 8.正常访问页面
  next();
});

/**
 * @description 路由跳转错误
 * */
router.onError(error => {
  console.warn('路由错误', error.message);
});

export default router;
