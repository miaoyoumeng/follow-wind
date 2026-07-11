import http from '@/request';
import { ResultData } from '@/request/modules.ts';
import { Menu } from '@/api/modules/auth.ts';

// 获取我的应用列表
export const getAppMenus = (): Promise<ResultData<Menu.MenuOptions[]>> => {
  return http.get('/security/app/menus');
};
