// ? 全局默认配置项

// 首页
export const HOME_URL: string = '/';
// 登录页
export const TO_LOGIN_URL: string = HOME_URL;
// 主页
export const MAIN_URL: string = '/main';

export const error_400: string = '/400';
export const error_401: string = '/401';
export const error_403: string = '/403';
export const error_404: string = '/404';
export const error_500: string = '/500';

// 框架布局名称
export const LAYOUT_FRAMEWORK: string = 'layout';

const ERROR_ROUTE_LIST: string[] = [error_400, error_401, error_403, error_404, error_500];

// 路由白名单地址（本地存在的路由 staticRouter.ts 中）
export const ROUTER_WHITE_LIST: string[] = [TO_LOGIN_URL, HOME_URL, ...ERROR_ROUTE_LIST];
