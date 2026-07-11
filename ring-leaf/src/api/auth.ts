import { RouteRecordRaw } from 'vue-router';
import http from '@/request';
import { ResultData } from '@/request/modules.ts';
// 获取菜单列表
export const getAppRouters = (appId: number): Promise<ResultData<RouteRecordRaw[]>> => {
  return http.get('/security/app/routers', { appId });
};
