import { ResultData } from '@/request/modules.ts';
import { Menu } from '@/api/modules/auth.ts';
import authMenuList from '@/assets/jsons/left-menus.json';

// 获取我的应用列表
export const getAppMenusApi = (): Promise<ResultData<Menu.MenuOptions[]>> => {
  return Promise.resolve(authMenuList as unknown as ResultData<Menu.MenuOptions[]>);
};
