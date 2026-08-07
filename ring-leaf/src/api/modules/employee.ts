/* ===== 员工列表 ===== */
export declare namespace EmployeeList {
  interface EmployeeItem {
    id: number;
    username: string;
    name: string;
    phone: string;
    wechatNickname: string;
    role: 'admin' | 'operator';
    joinDate: string;
    apps: string[];
    status: 'active' | 'inactive';
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
  }

  interface ListParams {
    name?: string;
    id?: number;
    role?: string;
    status?: string;
    pageNum: number;
    pageSize: number;
  }

  interface DetailParams {
    id: number;
  }

  interface UpdateParams {
    id: number;
    name: string;
    phone: string;
    role: 'admin' | 'operator';
    joinDate: string;
    apps: string[];
    status: 'active' | 'inactive';
  }

  interface ToggleStatusParams {
    id: number;
    status: 'active' | 'inactive';
  }

  interface RoleOption {
    value: 'admin' | 'operator';
    label: string;
  }

  interface AppOption {
    value: string;
    label: string;
  }
}
