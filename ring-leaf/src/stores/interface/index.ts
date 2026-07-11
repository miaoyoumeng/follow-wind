import { RouteRecordRaw } from 'vue-router';
import { AssemblySizeType, LanguageType, LayoutType } from '@/typings/global.d';

/* UserInfo 用户信息 */
export interface UserInfo {
  token?: string;
  timestamp?: number;
  info?: {
    name: string; //账号名称
    displayName: string; //显示名称
    roles: number[]; //角色
    profilePicture: string; //头像
  };
}

/* AuthState */
export interface AuthState {
  /* 角色编码 */
  roleCode: string;
  /* 路由权限列表 */
  authRouterList: RouteRecordRaw[];
}

/* PageState */
export interface PageState {
  layout: LayoutType;
  assemblySize: AssemblySizeType;
  language: LanguageType;
  maximize: boolean;
  primary: string;
  isDark: boolean;
  isGrey: boolean;
  isWeak: boolean;
  asideInverted: boolean;
  headerInverted: boolean;
  isCollapse: boolean;
  accordion: boolean;
  breadcrumb: boolean;
  breadcrumbIcon: boolean;
  tabs: boolean;
  tabsIcon: boolean;
  footer: boolean;
}

/* tabsMenuProps */
export interface TabsMenuProps {
  icon: string;
  title: string;
  path: string;
  name: string;
  close: boolean;
  isKeepAlive: boolean;
}

/* TabsState */
export interface TabsState {
  tabsMenuList: TabsMenuProps[];
}

/* KeepAliveState */
export interface KeepAliveState {
  keepAliveName: string[];
}
