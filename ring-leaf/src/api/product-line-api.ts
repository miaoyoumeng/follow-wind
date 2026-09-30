import { type ResultData } from '@/request/modules';
import { type ProductLine, type ProductLinePayChannel, type ProductLineAttribute } from '@/api/models/product-line';
import productLineList from '@/assets/mocks/product-line.json';
import productLinePayChannels from '@/assets/mocks/product-line-pay-channels.json';
import productLineAttributes from '@/assets/mocks/product-line-attributes.json';
import { formatNow } from '@/utils/date';

const mockResponse = <T>(data: T): Promise<ResultData<T>> =>
  Promise.resolve({ code: 200, displayMsg: '操作成功', data, uniqCode: 'SUCCESS', msg: 'success' } as unknown as ResultData<T>);

const mockSuccess = (): Promise<ResultData<null>> =>
  Promise.resolve({ code: 200, displayMsg: '操作成功', data: null, uniqCode: 'SUCCESS', msg: 'success' } as unknown as ResultData<null>);

export const getProductLineListApi = (params: ProductLine.ListParams): Promise<ResultData<ProductLine.ListResult>> => {
  let { list } = productLineList.data as { list: ProductLine.ProductLineItem[]; total: number };
  if (params.type) {
    list = list.filter(item => item.type === params.type);
  }
  if (params.status) {
    list = list.filter(item => item.status === params.status);
  }
  if (params.name) {
    list = list.filter(item => item.name.includes(params.name as string));
  }
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;
  return mockResponse<ProductLine.ListResult>({ list: list.slice(start, end), total: list.length });
};

export const createProductLineApi = (data: ProductLine.CreateParams): Promise<ResultData<null>> => {
  const list = (productLineList.data as { list: ProductLine.ProductLineItem[] }).list;
  const nextId = list.reduce((max, item) => Math.max(max, item.id), 10000) + 1;
  list.unshift({
    id: nextId,
    name: data.name,
    code: data.code,
    type: data.type,
    status: 'enabled',
    icon: data.icon ?? '',
    description: data.description ?? '',
    skuCount: 0,
    createdBy: 'admin',
    createdAt: formatNow(),
    updatedBy: 'admin',
    updatedAt: formatNow()
  });
  return mockSuccess();
};

export const updateProductLineApi = (data: ProductLine.UpdateParams): Promise<ResultData<null>> => {
  const list = (productLineList.data as { list: ProductLine.ProductLineItem[] }).list;
  const target = list.find(item => item.id === data.id);
  if (target) {
    target.name = data.name;
    target.type = data.type;
    target.icon = data.icon ?? '';
    target.description = data.description ?? '';
    target.updatedBy = 'admin';
    target.updatedAt = formatNow();
  }
  return mockSuccess();
};

export const deleteProductLineApi = (id: number): Promise<ResultData<null>> => {
  const list = (productLineList.data as { list: ProductLine.ProductLineItem[] }).list;
  const index = list.findIndex(item => item.id === id);
  if (index >= 0) {
    list.splice(index, 1);
  }
  return mockSuccess();
};

export const getProductLineDetailApi = (id: number): Promise<ResultData<ProductLine.ProductLineItem>> => {
  const item = (productLineList.data as { list: ProductLine.ProductLineItem[] }).list.find(i => i.id === id);
  return mockResponse<ProductLine.ProductLineItem>(item as ProductLine.ProductLineItem);
};

export const getProductLinePayChannelListApi = (params: ProductLinePayChannel.ListParams): Promise<ResultData<ProductLinePayChannel.ListResult>> => {
  const list = (productLinePayChannels.data as { list: ProductLinePayChannel.PayChannelItem[] }).list.filter(
    item => item.productLineId === params.productLineId
  );
  return mockResponse<ProductLinePayChannel.ListResult>({ list, total: list.length });
};

export const createProductLinePayChannelApi = (data: ProductLinePayChannel.CreateParams): Promise<ResultData<null>> => {
  const list = (productLinePayChannels.data as { list: ProductLinePayChannel.PayChannelItem[] }).list;
  const nextId = list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  list.push({
    id: nextId,
    productLineId: data.productLineId,
    channelType: data.channelType,
    channelName: data.channelType === 'wechat' ? '微信支付' : '支付宝',
    merchantId: data.merchantId,
    companyName: data.companyName,
    status: 'enabled'
  });
  return mockSuccess();
};

export const updateProductLinePayChannelApi = (data: ProductLinePayChannel.UpdateParams): Promise<ResultData<null>> => {
  const list = (productLinePayChannels.data as { list: ProductLinePayChannel.PayChannelItem[] }).list;
  const target = list.find(item => item.id === data.id);
  if (target) {
    target.merchantId = data.merchantId;
    target.companyName = data.companyName;
  }
  return mockSuccess();
};

export const getProductLineAttributeListApi = (params: ProductLineAttribute.ListParams): Promise<ResultData<ProductLineAttribute.ListResult>> => {
  const list = (productLineAttributes.data as { list: ProductLineAttribute.AttributeItem[] }).list.filter(
    item => item.productLineId === params.productLineId
  );
  return mockResponse<ProductLineAttribute.ListResult>({ list, total: list.length });
};

export const createProductLineAttributeApi = (data: ProductLineAttribute.CreateParams): Promise<ResultData<null>> => {
  const list = (productLineAttributes.data as { list: ProductLineAttribute.AttributeItem[] }).list;
  const nextId = list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  list.push({ id: nextId, productLineId: data.productLineId, name: data.name, value: data.value });
  return mockSuccess();
};

export const updateProductLineAttributeApi = (data: ProductLineAttribute.UpdateParams): Promise<ResultData<null>> => {
  const list = (productLineAttributes.data as { list: ProductLineAttribute.AttributeItem[] }).list;
  const target = list.find(item => item.id === data.id);
  if (target) {
    target.name = data.name;
    target.value = data.value;
  }
  return mockSuccess();
};

export const deleteProductLineAttributeApi = (id: number): Promise<ResultData<null>> => {
  const list = (productLineAttributes.data as { list: ProductLineAttribute.AttributeItem[] }).list;
  const index = list.findIndex(item => item.id === id);
  if (index >= 0) {
    list.splice(index, 1);
  }
  return mockSuccess();
};
