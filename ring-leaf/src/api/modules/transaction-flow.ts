import mockData from '@/assets/jsons/transaction-flow-list.json';
import { ResultData } from '@/request/modules';

export declare namespace TransactionFlow {
  type TxType = 'pay' | 'refund';
  type Channel = 'wechat' | 'alipay';

  interface FlowItem {
    id: number;
    flowNo: string;
    orderNo: string;
    userId: string;
    userName: string;
    appName: string;
    txType: TxType;
    amount: number;
    channel: Channel;
    channelName: string;
    txTime: string;
  }

  interface ListParams {
    appId?: string;
    txType?: TxType;
    channel?: Channel;
    date?: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface ListResult {
    list: FlowItem[];
    total: number;
  }

  interface SummaryResult {
    todayPayCount: number;
    todayPayAmount: number;
    todayRefundAmount: number;
  }

  interface FlowDetail {
    flowNo: string;
    orderNo: string;
    userId: string;
    userName: string;
    appName: string;
    txType: TxType;
    txTypeName: string;
    amount: number;
    channel: Channel;
    channelName: string;
    txTime: string;
  }
}

interface MockFlowItem {
  id: number;
  flowNo: string;
  orderNo: string;
  userId: string;
  userName: string;
  appName: string;
  txType: string;
  amount: number;
  channel: string;
  channelName: string;
  txTime: string;
}

const rawData = mockData.data as unknown as {
  summary: TransactionFlow.SummaryResult;
  list: MockFlowItem[];
  total: number;
};

const toFlowItem = (item: MockFlowItem): TransactionFlow.FlowItem => ({
  ...item,
  txType: item.txType as TransactionFlow.TxType,
  channel: item.channel as TransactionFlow.Channel
});

const buildResponse = <T>(data: T): ResultData<T> => ({
  code: '200',
  msg: '成功',
  data
});

// TODO: 后端接口就绪后替换为 http.get
export const getTransactionFlowListApi = (params: TransactionFlow.ListParams): Promise<ResultData<TransactionFlow.ListResult>> => {
  let filtered = rawData.list.map(toFlowItem);
  if (params.appId) filtered = filtered.filter(item => item.appName === params.appId);
  if (params.txType) filtered = filtered.filter(item => item.txType === params.txType);
  if (params.channel) filtered = filtered.filter(item => item.channel === params.channel);
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(
      item =>
        item.flowNo.toLowerCase().includes(kw) || item.orderNo.toLowerCase().includes(kw) || item.userName.includes(kw) || item.userId.includes(kw)
    );
  }
  const start = (params.pageNum - 1) * params.pageSize;
  const pagedList = filtered.slice(start, start + params.pageSize);
  return Promise.resolve(buildResponse({ list: pagedList, total: filtered.length }));
};

// TODO: 后端接口就绪后替换为 http.get
export const getTransactionFlowSummaryApi = (): Promise<ResultData<TransactionFlow.SummaryResult>> => {
  return Promise.resolve(buildResponse(rawData.summary));
};

// TODO: 后端接口就绪后替换为 http.get
export const getTransactionFlowDetailApi = (id: number): Promise<ResultData<TransactionFlow.FlowDetail>> => {
  const item = rawData.list.find(i => i.id === id);
  if (!item) return Promise.reject(new Error('Not found'));
  return Promise.resolve(
    buildResponse({
      flowNo: item.flowNo,
      orderNo: item.orderNo,
      userId: item.userId,
      userName: item.userName,
      appName: item.appName,
      txType: item.txType as TransactionFlow.TxType,
      txTypeName: item.txType === 'pay' ? '支付成功' : '退款成功',
      amount: item.amount,
      channel: item.channel as TransactionFlow.Channel,
      channelName: item.channelName,
      txTime: item.txTime
    })
  );
};
