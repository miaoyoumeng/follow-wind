/* ===== 操作日志 ===== */
export declare namespace OperationLog {
  interface LogItem {
    id: number;
    operateTime: string;
    operatorName: string;
    module: string;
    operateType: '登录' | '新增' | '修改' | '删除' | '启用' | '停用';
    content: string;
    ip: string;
  }

  interface ListParams {
    operatorName?: string;
    module?: string;
    operateType?: string;
    dateRange?: [string, string];
    pageNum: number;
    pageSize: number;
  }
}
