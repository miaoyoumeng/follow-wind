import mockData from '@/assets/jsons/today-order-list.json';
import { ResultData } from '@/request/modules';

export declare namespace TodayOrder {
  type UnpaidStatus = 'pending' | 'expired' | 'cancelled';

  interface PaidOrderItem {
    id: number;
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
    appName: string;
    skuName: string;
    payAmount: number;
    payMethod: string;
    orderTime: string;
  }

  interface UnpaidOrderItem {
    id: number;
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
    appName: string;
    skuName: string;
    orderAmount: number;
    unpaidStatus: UnpaidStatus;
    unpaidStatusName: string;
    orderTime: string;
    expireTime: string;
  }

  interface RefundOrderItem {
    id: number;
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
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

  interface PaidListParams {
    appId?: string;
    dateRange?: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface UnpaidListParams {
    appId?: string;
    unpaidStatus?: UnpaidStatus;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface RefundListParams {
    appId?: string;
    dateRange?: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface SummaryResult {
    orderCount: number;
    totalAmount: number;
  }

  interface PaidDetail {
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
    appName: string;
    skuName: string;
    payMethod: string;
    payTime: string;
    orderAmount: number;
    payAmount: number;
  }

  interface UnpaidDetail {
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
    appName: string;
    skuName: string;
    orderAmount: number;
    orderTime: string;
    expireTime: string;
    unpaidStatus: UnpaidStatus;
    unpaidStatusName: string;
  }

  interface RefundDetail {
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
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

  interface NoteItem {
    id: number;
    content: string;
    creator: string;
    createdAt: string;
  }

  interface NoteListResult {
    list: NoteItem[];
  }

  interface AddNoteParams {
    orderNo: string;
    content: string;
  }
}

interface MockPaidItem {
  id: number;
  orderNo: string;
  userId: string;
  userName: string;
  phone: string;
  appName: string;
  skuName: string;
  payAmount: number;
  payMethod: string;
  orderTime: string;
}

interface MockUnpaidItem {
  id: number;
  orderNo: string;
  userId: string;
  userName: string;
  phone: string;
  appName: string;
  skuName: string;
  orderAmount: number;
  unpaidStatus: string;
  unpaidStatusName: string;
  orderTime: string;
  expireTime: string;
}

interface MockRefundItem {
  id: number;
  orderNo: string;
  userId: string;
  userName: string;
  phone: string;
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

const rawData = mockData.data as unknown as {
  paidSummary: TodayOrder.SummaryResult;
  unpaidSummary: TodayOrder.SummaryResult;
  refundSummary: TodayOrder.SummaryResult;
  paidList: MockPaidItem[];
  unpaidList: MockUnpaidItem[];
  refundList: MockRefundItem[];
};

const buildResponse = <T>(data: T): ResultData<T> => ({
  code: '200',
  msg: '成功',
  data
});

// ===== 支付订单列表 =====
export const getTodayPaidOrderListApi = (
  params: TodayOrder.PaidListParams
): Promise<ResultData<{ list: TodayOrder.PaidOrderItem[]; total: number; summary: TodayOrder.SummaryResult }>> => {
  let filtered = rawData.paidList.map((item): TodayOrder.PaidOrderItem => ({
    ...item
  }));
  if (params.appId) filtered = filtered.filter(item => item.appName === params.appId);
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(item => item.orderNo.toLowerCase().includes(kw) || item.userName.includes(kw) || item.userId.includes(kw));
  }
  const total = filtered.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const pagedList = filtered.slice(start, start + params.pageSize);
  return Promise.resolve(
    buildResponse({
      list: pagedList,
      total,
      summary: { orderCount: total, totalAmount: filtered.reduce((sum, i) => sum + i.payAmount, 0) }
    })
  );
};

// ===== 未支付订单列表 =====
export const getTodayUnpaidOrderListApi = (
  params: TodayOrder.UnpaidListParams
): Promise<ResultData<{ list: TodayOrder.UnpaidOrderItem[]; total: number; summary: TodayOrder.SummaryResult }>> => {
  let filtered = rawData.unpaidList.map((item): TodayOrder.UnpaidOrderItem => ({
    ...item,
    unpaidStatus: item.unpaidStatus as TodayOrder.UnpaidStatus
  }));
  if (params.appId) filtered = filtered.filter(item => item.appName === params.appId);
  if (params.unpaidStatus) filtered = filtered.filter(item => item.unpaidStatus === params.unpaidStatus);
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(item => item.orderNo.toLowerCase().includes(kw) || item.userName.includes(kw) || item.userId.includes(kw));
  }
  const total = filtered.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const pagedList = filtered.slice(start, start + params.pageSize);
  return Promise.resolve(
    buildResponse({
      list: pagedList,
      total,
      summary: { orderCount: total, totalAmount: filtered.reduce((sum, i) => sum + i.orderAmount, 0) }
    })
  );
};

// ===== 退单列表 =====
export const getTodayRefundOrderListApi = (
  params: TodayOrder.RefundListParams
): Promise<ResultData<{ list: TodayOrder.RefundOrderItem[]; total: number; summary: TodayOrder.SummaryResult }>> => {
  let filtered = rawData.refundList.map((item): TodayOrder.RefundOrderItem => ({
    ...item
  }));
  if (params.appId) filtered = filtered.filter(item => item.appName === params.appId);
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(item => item.orderNo.toLowerCase().includes(kw) || item.userName.includes(kw) || item.userId.includes(kw));
  }
  const total = filtered.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const pagedList = filtered.slice(start, start + params.pageSize);
  return Promise.resolve(
    buildResponse({
      list: pagedList,
      total,
      summary: { orderCount: total, totalAmount: filtered.reduce((sum, i) => sum + i.refundAmount, 0) }
    })
  );
};

// ===== 支付订单详情 =====
export const getTodayPaidOrderDetailApi = (id: number): Promise<ResultData<TodayOrder.PaidDetail>> => {
  const item = rawData.paidList.find(i => i.id === id);
  if (!item) return Promise.reject(new Error('Not found'));
  return Promise.resolve(
    buildResponse({
      orderNo: item.orderNo,
      userId: item.userId,
      userName: item.userName,
      phone: item.phone,
      appName: item.appName,
      skuName: item.skuName,
      payMethod: item.payMethod,
      payTime: item.orderTime,
      orderAmount: item.payAmount,
      payAmount: item.payAmount
    })
  );
};

// ===== 未支付订单详情 =====
export const getTodayUnpaidOrderDetailApi = (id: number): Promise<ResultData<TodayOrder.UnpaidDetail>> => {
  const item = rawData.unpaidList.find(i => i.id === id);
  if (!item) return Promise.reject(new Error('Not found'));
  return Promise.resolve(
    buildResponse({
      orderNo: item.orderNo,
      userId: item.userId,
      userName: item.userName,
      phone: item.phone,
      appName: item.appName,
      skuName: item.skuName,
      orderAmount: item.orderAmount,
      orderTime: item.orderTime,
      expireTime: item.expireTime,
      unpaidStatus: item.unpaidStatus as TodayOrder.UnpaidStatus,
      unpaidStatusName: item.unpaidStatusName
    })
  );
};

// ===== 退单详情 =====
export const getTodayRefundOrderDetailApi = (id: number): Promise<ResultData<TodayOrder.RefundDetail>> => {
  const item = rawData.refundList.find(i => i.id === id);
  if (!item) return Promise.reject(new Error('Not found'));
  return Promise.resolve(
    buildResponse({
      orderNo: item.orderNo,
      userId: item.userId,
      userName: item.userName,
      phone: item.phone,
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

// ===== 备注列表 =====
const mockNotes: Record<string, TodayOrder.NoteItem[]> = {
  ORD001: [
    { id: 1, content: '该用户是VIP客户，已赠送优惠券', creator: '管理员A', createdAt: '2026-07-30 09:30:00' },
    { id: 2, content: '用户咨询了年卡续费问题', creator: '管理员B', createdAt: '2026-07-29 15:00:00' }
  ]
};

export const getOrderNotesApi = (orderNo: string): Promise<ResultData<TodayOrder.NoteListResult>> => {
  const list = mockNotes[orderNo] || [];
  return Promise.resolve(buildResponse({ list }));
};

// ===== 添加备注 =====
export const addOrderNoteApi = (params: TodayOrder.AddNoteParams): Promise<ResultData<TodayOrder.NoteItem>> => {
  const notes = mockNotes[params.orderNo] || [];
  const newNote: TodayOrder.NoteItem = {
    id: notes.length + 1,
    content: params.content,
    creator: '管理员',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  if (!mockNotes[params.orderNo]) mockNotes[params.orderNo] = [];
  mockNotes[params.orderNo].push(newNote);
  return Promise.resolve(buildResponse(newNote));
};
