import mockData from '@/assets/jsons/fulfilling-order-list.json';
import { ResultData } from '@/request/modules';

export declare namespace FulfillingOrder {
  type ConfirmStatus = 'confirming' | 'expiring';

  interface FulfillingOrderItem {
    id: number;
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
    appName: string;
    skuName: string;
    orderAmount: number;
    payAmount: number;
    confirmedAmount: number;
    payMethod: string;
    orderTime: string;
    payTime: string;
    expireTime: string;
    confirmStatus: ConfirmStatus;
    confirmStatusName: string;
  }

  interface ListParams {
    appId?: string;
    confirmStatus?: ConfirmStatus;
    orderTimeRange?: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface SummaryResult {
    orderCount: number;
    totalAmount: number;
    confirmedAmount: number;
  }

  interface ConfirmRecord {
    date: string;
    amount: number;
  }

  interface Detail {
    orderNo: string;
    userId: string;
    userName: string;
    phone: string;
    appName: string;
    skuName: string;
    payMethod: string;
    payTime: string;
    expireTime: string;
    orderAmount: number;
    payAmount: number;
    confirmedAmount: number;
    confirmProgress: number;
    confirmRecords: ConfirmRecord[];
  }
}

interface MockItem {
  id: number;
  orderNo: string;
  userId: string;
  userName: string;
  phone: string;
  appName: string;
  skuName: string;
  orderAmount: number;
  payAmount: number;
  confirmedAmount: number;
  payMethod: string;
  orderTime: string;
  payTime: string;
  expireTime: string;
  confirmStatus: string;
  confirmStatusName: string;
}

const rawData = mockData.data as unknown as {
  summary: FulfillingOrder.SummaryResult;
  list: MockItem[];
  confirmRecords: FulfillingOrder.ConfirmRecord[];
};

const buildResponse = <T>(data: T): ResultData<T> => ({
  code: '200',
  msg: '成功',
  data
});

// ===== 在履约订单列表 =====
export const getFulfillingOrderListApi = (
  params: FulfillingOrder.ListParams
): Promise<ResultData<{ list: FulfillingOrder.FulfillingOrderItem[]; total: number; summary: FulfillingOrder.SummaryResult }>> => {
  let filtered = rawData.list.map((item): FulfillingOrder.FulfillingOrderItem => ({
    ...item,
    confirmStatus: item.confirmStatus as FulfillingOrder.ConfirmStatus
  }));
  if (params.appId) filtered = filtered.filter(item => item.appName === params.appId);
  if (params.confirmStatus) filtered = filtered.filter(item => item.confirmStatus === params.confirmStatus);
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
        totalAmount: filtered.reduce((sum, i) => sum + i.payAmount, 0),
        confirmedAmount: filtered.reduce((sum, i) => sum + i.confirmedAmount, 0)
      }
    })
  );
};

// ===== 在履约订单详情 =====
export const getFulfillingOrderDetailApi = (id: number): Promise<ResultData<FulfillingOrder.Detail>> => {
  const item = rawData.list.find(i => i.id === id);
  if (!item) return Promise.reject(new Error('Not found'));
  const confirmProgress = item.payAmount > 0 ? (item.confirmedAmount / item.payAmount) * 100 : 0;
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
      expireTime: item.expireTime,
      orderAmount: item.orderAmount,
      payAmount: item.payAmount,
      confirmedAmount: item.confirmedAmount,
      confirmProgress: Math.round(confirmProgress * 10) / 10,
      confirmRecords: rawData.confirmRecords.map(r => ({ ...r }))
    })
  );
};
