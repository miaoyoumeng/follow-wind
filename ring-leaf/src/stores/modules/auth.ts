import { defineStore } from 'pinia';
import { RouteRecordRaw } from 'vue-router';
import { AuthState } from '@/stores/interface';
import { getAppRouters } from '@/api/auth';
import piniaPersistConfig from '@/stores/config/persist.ts';

export const useAuthStore = defineStore('leaf-vein-auth', {
  state: (): AuthState => ({
    roleCode: '',
    // 菜单权限列表
    authRouterList: []
  }),
  getters: {
    // 菜单权限列表 ==> 这里的菜单没有经过任何处理
    routerListGet: (state: AuthState) => state.authRouterList
  },
  actions: {
    async getRouterList(appId: number) {
      const { data } = await getAppRouters(appId);
      this.authRouterList = getFlatMenuList(data);
    },
    // Set RoleCode
    async setRoleCode(code: string) {
      this.roleCode = code;
    },
    // Set RoleCode
    async clear() {
      this.roleCode = '';
      this.authRouterList = [];
    }
  },
  persist: piniaPersistConfig('auth_router_info')
});

/** 将子路由的内容处理扁平化数组 */
function getFlatMenuList(routeList: RouteRecordRaw[]): RouteRecordRaw[] {
  let newMenuList: RouteRecordRaw[] = [...routeList];
  return newMenuList.flatMap(item => {
    const children: RouteRecordRaw[] = item.children ? item.children : [];
    item.children = [];
    return [item, ...(children ? getFlatMenuList(children) : [])];
  });
}
