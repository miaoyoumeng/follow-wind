/* eslint-disable @typescript-eslint/no-namespace -- 项目架构规范要求类型声明使用 declare namespace，见 CLAUDE.md */
/* 菜单 */
export declare namespace Menu {
  interface MetaProps {
    icon: string; // icon
    title: string; //菜单名称
    activeMenu?: string;
    isLink?: boolean; // 是否是链接
    isHide: boolean; // 是否隐藏
    isFull: boolean; //是否是全路径
    isKeepAlive: boolean;
  }
  interface MenuOptions {
    id: number;
    path: string;
    name: string;
    component?: string | (() => Promise<unknown>);
    redirect?: string;
    meta: MetaProps;
    children?: MenuOptions[];
  }
}
