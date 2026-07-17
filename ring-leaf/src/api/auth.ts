import { RouteRecordRaw } from 'vue-router';
import { ResultData } from '@/request/modules.ts';
import authMenuList from '@/assets/jsons/left-menus.json';
// 获取菜单列表
export const getAppRouters = (appId: number): Promise<ResultData<RouteRecordRaw[]>> => {
  console.log(appId);
  return Promise.resolve(authMenuList as unknown as ResultData<RouteRecordRaw[]>);
};
