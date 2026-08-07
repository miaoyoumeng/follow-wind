import { ResultData, ResPage } from '@/request/modules.ts';
import type { EmployeeList } from '@/api/modules/employee.ts';
import employeeMock from '@/assets/jsons/employee-list.json';

/* ===== 员工列表 ===== */

export const getEmployeeListApi = (params: EmployeeList.ListParams): Promise<ResultData<ResPage<EmployeeList.EmployeeItem>>> => {
  const { pageNum, pageSize, name, id, role, status } = params;
  let list = employeeMock.data.list as EmployeeList.EmployeeItem[];

  if (name) {
    list = list.filter(item => item.name.includes(name));
  }
  if (id !== undefined && id !== null && id !== 0) {
    list = list.filter(item => item.id === id);
  }
  if (role && role !== 'all') {
    list = list.filter(item => item.role === role);
  }
  if (status && status !== 'all') {
    list = list.filter(item => item.status === status);
  }

  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pageList = list.slice(start, end);

  return Promise.resolve({
    code: '200',
    msg: '成功',
    displayMsg: '',
    uniqCode: '',
    data: { list: pageList, total, pageNum, pageSize }
  });
};

export const getEmployeeDetailApi = (params: EmployeeList.DetailParams): Promise<ResultData<EmployeeList.EmployeeItem>> => {
  const list = employeeMock.data.list as EmployeeList.EmployeeItem[];
  const item = list.find(e => e.id === params.id);
  if (!item) {
    return Promise.reject(new Error('员工不存在'));
  }
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: item });
};

export const updateEmployeeApi = (params: EmployeeList.UpdateParams): Promise<ResultData<null>> => {
  const list = employeeMock.data.list as EmployeeList.EmployeeItem[];
  const item = list.find(e => e.id === params.id);
  if (!item) {
    return Promise.reject(new Error('员工不存在'));
  }
  if (item.role === 'admin' && params.status === 'inactive') {
    return Promise.reject(new Error('管理者角色不可被停用'));
  }
  if (!/^1\d{10}$/.test(params.phone)) {
    return Promise.reject(new Error('请输入合法的11位手机号'));
  }
  if (params.name.length < 2 || params.name.length > 20) {
    return Promise.reject(new Error('姓名长度为 2-20 字符'));
  }

  item.name = params.name;
  item.phone = params.phone;
  item.role = params.role;
  item.joinDate = params.joinDate;
  item.apps = params.apps;
  item.status = params.status;
  item.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  item.updatedBy = '管理员';

  return Promise.resolve({ code: '200', msg: '员工信息已更新', displayMsg: '', uniqCode: '', data: null });
};
