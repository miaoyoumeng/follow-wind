import mockData from '@/assets/jsons/completed-order-list.json';
import { ResultData } from '@/request/modules';

export declare namespace CompletedOrder {
  interface RefundOrderItem {
    id: number;
    orderNo: string;
    userId: string;
    userName: string;
    appName: string;
    skuName: string;
    payMethod: string;
    payTime: string;
    payAmount: number;
    confirmedAmount: number;
    refundAmount: number;
    refundReason: string;
    refundTime: string;
    reviewer: string;
    orderTime: string;
  }

  interface CompletedOrderItem {
    id: number;
    orderNo: string;
    userId: string;
    userName: string;
    appName: string;
    skuName: string;
    payMethod: string;
    payTime: string;
    payAmount: number;
    confirmedAmount: number;
    refundAmount: number;
    couponDeduction: number;
    completeTime: string;
  }

  interface RefundListParams {
    appId?: string;
    orderTimeRange?: string;
    refundTimeRange?: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface CompletedListParams {
    appId?: string;
    payMethod?: string;
    completeTimeRange?: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface SummaryResult {
    orderCount: number;
    totalAmount: number;
  }

  interface RefundDetail {
    orderNo: string;
    userId: string;
    userName: string;
    appName: string;
    skuName: string;
    payMethod: string;
    payTime: string;
    payAmount: number;
    confirmedAmount: number;
    refundAmount: number;
    refundReason: string;
    refundTime: string;
    reviewer: string;
  }

  interface CompletedDetail {
    orderNo: string;
    userId: string;
    userName: string;
    appName: string;
    skuName: string;
    payMethod: string;
    payTime: string;
    payAmount: number;
    confirmedAmount: number;
    refundAmount: number;
    couponDeduction: number;
    confirmRecords: ConfirmRecord[];
    refundRecords: RefundRecord[];
  }

  interface ConfirmRecord {
    date: string;
    amount: number;
  }

  interface RefundRecord {
    date: string;
    amount: number;
    reason: string;
  }
}

interface MockRefundItem {
  id: number;
  orderNo: string;
  userId: string;
  userName: string;
  appName: string;
  skuName: string;
  payMethod: string;
  payTime: string;
  payAmount: number;
  confirmedAmount: number;
  refundAmount: number;
  refundReason: string;
  refundTime: string;
  reviewer: string;
  orderTime: string;
}

interface MockCompletedItem {
  id: number;
  orderNo: string;
  userId: string;
  userName: string;
  appName: string;
  skuName: string;
  payMethod: string;
  payTime: string;
  payAmount: number;
  confirmedAmount: number;
  refundAmount: number;
  couponDeduction: number;
  completeTime: string;
}

interface MockConfirmRecord {
  date: string;
  amount: number;
}

const rawData = mockData.data as unknown as {
  refundList: MockRefundItem[];
  completedList: MockCompletedItem[];
  confirmRecords: MockConfirmRecord[];
  refundRecords: { date: string; amount: number; reason: string }[];
};

const buildResponse = <T>(data: T): ResultData<T> => ({
  code: '200',
  msg: '成功',
  data
});

// ===== 退单列表 =====
export const getRefundOrderListApi = (
  params: CompletedOrder.RefundListParams
): Promise<ResultData<{ list: CompletedOrder.RefundOrderItem[]; total: number; summary: CompletedOrder.SummaryResult }>> => {
  let filtered = rawData.refundList.map((item): CompletedOrder.RefundOrderItem => ({ ...item }));
  if (params.appId) filtered = filtered.filter(item => item.appName === params.appId);
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(
      item => item.orderNo.toLowerCase().includes(kw) || item.userName.toLowerCase().includes(kw) || item.userId.includes(kw)
    );
  }
  const total = filtered.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const pagedList = filtered.slice(start, start + params.pageSize);
  return Promise.resolve(
    buildResponse({
      list: pagedList,
      total,
      summary: {
        orderCount: total,
        totalAmount: filtered.reduce((sum, i) => sum + i.refundAmount, 0)
      }
    })
  );
};

// ===== 完成交易订单列表 =====
export const getCompletedOrderListApi = (
  params: CompletedOrder.CompletedListParams
): Promise<
  ResultData<{
    list: CompletedOrder.CompletedOrderItem[];
    total: number;
    paySummary: CompletedOrder.SummaryResult;
    confirmSummary: CompletedOrder.SummaryResult;
    refundSummary: CompletedOrder.SummaryResult;
  }>
> => {
  let filtered = rawData.completedList.map((item): CompletedOrder.CompletedOrderItem => ({ ...item }));
  if (params.appId) filtered = filtered.filter(item => item.appName === params.appId);
  if (params.payMethod) filtered = filtered.filter(item => item.payMethod === params.payMethod);
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(
      item => item.orderNo.toLowerCase().includes(kw) || item.userName.toLowerCase().includes(kw) || item.userId.includes(kw)
    );
  }
  const total = filtered.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const pagedList = filtered.slice(start, start + params.pageSize);
  return Promise.resolve(
    buildResponse({
      list: pagedList,
      total,
      paySummary: {
        orderCount: total,
        totalAmount: filtered.reduce((sum, i) => sum + i.payAmount, 0)
      },
      confirmSummary: {
        orderCount: total,
        totalAmount: filtered.reduce((sum, i) => sum + i.confirmedAmount, 0)
      },
      refundSummary: {
        orderCount: total,
        totalAmount: filtered.reduce((sum, i) => sum + i.refundAmount, 0)
      }
    })
  );
};

// ===== 退单详情 =====
export const getRefundOrderDetailApi = (id: number): Promise<ResultData<CompletedOrder.RefundDetail>> => {
  const item = rawData.refundList.find(i => i.id === id);
  if (!item) return Promise.reject(new Error('Not found'));
  return Promise.resolve(
    buildResponse({
      orderNo: item.orderNo,
      userId: item.userId,
      userName: item.userName,
      appName: item.appName,
      skuName: item.skuName,
      payMethod: item.payMethod,
      payTime: item.payTime,
      payAmount: item.payAmount,
      confirmedAmount: item.confirmedAmount,
      refundAmount: item.refundAmount,
      refundReason: item.refundReason,
      refundTime: item.refundTime,
      reviewer: item.reviewer
    })
  );
};

// ===== 完成交易订单详情 =====
export const getCompletedOrderDetailApi = (id: number): Promise<ResultData<CompletedOrder.CompletedDetail>> => {
  const item = rawData.completedList.find(i => i.id === id);
  if (!item) return Promise.reject(new Error('Not found'));
  return Promise.resolve(
    buildResponse({
      orderNo: item.orderNo,
      userId: item.userId,
      userName: item.userName,
      appName: item.appName,
      skuName: item.skuName,
      payMethod: item.payMethod,
      payTime: item.payTime,
      payAmount: item.payAmount,
      confirmedAmount: item.confirmedAmount,
      refundAmount: item.refundAmount,
      couponDeduction: item.couponDeduction,
      confirmRecords: rawData.confirmRecords.map((r): CompletedOrder.ConfirmRecord => ({ ...r })),
      refundRecords: rawData.refundRecords.map((r): CompletedOrder.RefundRecord => ({ ...r }))
    })
  );
};
