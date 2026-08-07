/* ===== 产品线管理 ===== */
export declare namespace ProductLine {
  interface ProductLineItem {
    id: number;
    name: string;
    code: string;
    type: 'app' | 'mini-program' | 'web';
    status: 'enabled' | 'disabled';
    icon: string;
    description: string;
    skuCount: number;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
  }

  interface ListParams {
    type?: 'app' | 'mini-program' | 'web';
    status?: 'enabled' | 'disabled';
    name?: string;
    pageNum: number;
    pageSize: number;
  }

  interface ListResult {
    list: ProductLineItem[];
    total: number;
  }

  interface CreateParams {
    name: string;
    code: string;
    type: 'app' | 'mini-program' | 'web';
    icon?: string;
    description?: string;
  }

  interface UpdateParams {
    id: number;
    name: string;
    type: 'app' | 'mini-program' | 'web';
    icon?: string;
    description?: string;
  }
}

/* ===== 产品线支付渠道 ===== */
export declare namespace ProductLinePayChannel {
  interface PayChannelItem {
    id: number;
    productLineId: number;
    channelType: 'wechat' | 'alipay';
    channelName: string;
    merchantId: string;
    companyName: string;
    status: 'enabled' | 'disabled';
  }

  interface ListParams {
    productLineId: number;
    pageNum: number;
    pageSize: number;
  }

  interface ListResult {
    list: PayChannelItem[];
    total: number;
  }

  interface CreateParams {
    productLineId: number;
    channelType: 'wechat' | 'alipay';
    merchantId: string;
    companyName: string;
  }

  interface UpdateParams {
    id: number;
    merchantId: string;
    companyName: string;
  }
}

/* ===== 产品线属性 ===== */
export declare namespace ProductLineAttribute {
  interface AttributeItem {
    id: number;
    productLineId: number;
    name: string;
    value: string;
  }

  interface ListParams {
    productLineId: number;
  }

  interface ListResult {
    list: AttributeItem[];
    total: number;
  }

  interface CreateParams {
    productLineId: number;
    name: string;
    value: string;
  }

  interface UpdateParams {
    id: number;
    name: string;
    value: string;
  }
}

/* ===== API 函数 ===== */
import { ResultData } from '@/request/modules';
import productLineList from '@/assets/jsons/product-line-list.json';
import productLinePayChannels from '@/assets/jsons/product-line-pay-channels.json';
import productLineAttributes from '@/assets/jsons/product-line-attributes.json';

// TODO: 后端接口就绪后替换为真实 HTTP 请求
const mockResponse = <T>(data: T): Promise<ResultData<T>> => Promise.resolve({ code: '200', msg: '成功', data } as ResultData<T>);

const mockSuccess = (): Promise<ResultData<null>> => Promise.resolve({ code: '200', msg: '成功', data: null } as ResultData<null>);

export const getProductLineListApi = (params: ProductLine.ListParams) => {
  let { list } = productLineList.data as { list: ProductLine.ProductLineItem[]; total: number };
  if (params.type) list = list.filter(item => item.type === params.type);
  if (params.status) list = list.filter(item => item.status === params.status);
  if (params.name) list = list.filter(item => item.name.includes(params.name as string));
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;
  return mockResponse<ProductLine.ListResult>({ list: list.slice(start, end), total: list.length });
};

export const createProductLineApi = (_data: ProductLine.CreateParams) => mockSuccess();

export const updateProductLineApi = (_data: ProductLine.UpdateParams) => mockSuccess();

export const deleteProductLineApi = (_id: number) => mockSuccess();

export const getProductLineDetailApi = (id: number) => {
  const item = (productLineList.data as { list: ProductLine.ProductLineItem[] }).list.find(i => i.id === id);
  return mockResponse<ProductLine.ProductLineItem>(item as ProductLine.ProductLineItem);
};

export const getProductLinePayChannelListApi = (params: ProductLinePayChannel.ListParams) => {
  const list = (productLinePayChannels.data as { list: ProductLinePayChannel.PayChannelItem[] }).list.filter(
    item => item.productLineId === params.productLineId
  );
  return mockResponse<ProductLinePayChannel.ListResult>({ list, total: list.length });
};

export const createProductLinePayChannelApi = (_data: ProductLinePayChannel.CreateParams) => mockSuccess();

export const updateProductLinePayChannelApi = (_data: ProductLinePayChannel.UpdateParams) => mockSuccess();

export const getProductLineAttributeListApi = (params: ProductLineAttribute.ListParams) => {
  const list = (productLineAttributes.data as { list: ProductLineAttribute.AttributeItem[] }).list.filter(
    item => item.productLineId === params.productLineId
  );
  return mockResponse<ProductLineAttribute.ListResult>({ list, total: list.length });
};

export const createProductLineAttributeApi = (_data: ProductLineAttribute.CreateParams) => mockSuccess();

export const updateProductLineAttributeApi = (_data: ProductLineAttribute.UpdateParams) => mockSuccess();

export const deleteProductLineAttributeApi = (_id: number) => mockSuccess();
