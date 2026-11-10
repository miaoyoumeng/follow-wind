// ? 全局默认配置项

// 首页
export const VITE_HOME_INDEX_URI: string = import.meta.env.VITE_HOME_INDEX_URI;
// 框架布局目录名称
export const LAYOUT_FRAMEWORK: string = 'layout';

export const error_400: string = '/400';
export const error_401: string = '/401';
export const error_403: string = '/403';
export const error_404: string = '/404';
export const error_500: string = '/500';

const ERROR_ROUTE_LIST: string[] = [error_400, error_401, error_403, error_404, error_500];

// 路由白名单地址（本地存在的路由 staticRouter.ts 中）
export const ROUTER_WHITE_LIST: string[] = [VITE_HOME_INDEX_URI, ...ERROR_ROUTE_LIST];
