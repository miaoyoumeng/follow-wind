import { type ResultData, type ResPage } from '@/request/modules.ts';
import type { OperationLog } from '@/api/models/operation-log.ts';
import logMock from '@/assets/mocks/operation-logs.json';

/* ===== 操作日志列表 ===== */

export const getOperationLogListApi = (params: OperationLog.ListParams): Promise<ResultData<ResPage<OperationLog.LogItem>>> => {
  const { pageNum, pageSize, operatorName, module, operateType, dateRange } = params;
  let list = logMock.data.list as OperationLog.LogItem[];

  if (operatorName && operatorName !== 'all') {
    list = list.filter(item => item.operatorName === operatorName);
  }
  if (module && module !== 'all') {
    list = list.filter(item => item.module === module);
  }
  if (operateType && operateType !== 'all') {
    list = list.filter(item => item.operateType === operateType);
  }
  if (dateRange?.length === 2) {
    const [start, end] = dateRange;
    list = list.filter(item => {
      const logDate = item.operateTime.slice(0, 10);
      return logDate >= start && logDate <= end;
    });
  }

  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pageList = list.slice(start, end);

  return Promise.resolve({
    code: 200,
    msg: '成功',
    displayMsg: '',
    uniqCode: '',
    data: { list: pageList, total, pageNum, pageSize }
  });
};
