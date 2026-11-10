// 请求响应参数（不包含data）
export interface Result {
  code: number;
  msg: string;
  displayMsg: string;
}

// 请求响应参数（包含data）
export interface ResultData<T = {}> extends Result {
  data: T;
}

// 分页响应参数
export interface ResPage<T> {
  list: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}

// 分页请求参数
export interface ReqPage {
  pageNo: number;
  pageSize: number;

  [property: string]: {};
}

export const PaginationReq10: ReqPage = {
  pageNo: 1,
  pageSize: 10
};

export const PaginationReq12: ReqPage = {
  pageNo: 1,
  pageSize: 12
};

export const PaginationReq15: ReqPage = {
  pageNo: 1,
  pageSize: 15
};

export const PaginationReq20: ReqPage = {
  pageNo: 1,
  pageSize: 20
};
