// ? 全局默认配置项

// 首页
export const HOME_URL = '/';
// 登录页
export const TO_LOGIN_URL: string = HOME_URL;
// 主页
export const MAIN_URL = '/main';

export const ERROR_400 = '/400';
export const ERROR_401 = '/401';
export const ERROR_403 = '/403';
export const ERROR_404 = '/404';
export const ERROR_500 = '/500';

// 框架布局名称
export const LAYOUT_FRAMEWORK = 'layout';

const ERROR_ROUTE_LIST: string[] = [ERROR_400, ERROR_401, ERROR_403, ERROR_404, ERROR_500];

// 路由白名单地址（本地存在的路由 staticRouter.ts 中）
export const ROUTER_WHITE_LIST: string[] = [TO_LOGIN_URL, HOME_URL, ...ERROR_ROUTE_LIST];
