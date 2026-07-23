import { ResultData } from '@/request/modules.ts';
import authMenuList from '@/assets/jsons/dynamic-routers.json';
// 获取菜单列表
export const getAppRouters = (appId: number): Promise<ResultData> => {
  console.log('appId:', appId);
  return Promise.resolve(authMenuList as unknown as ResultData);
};
