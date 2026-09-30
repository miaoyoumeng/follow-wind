/* eslint-disable @typescript-eslint/no-namespace -- 项目架构规范要求类型声明使用 declare namespace，见 CLAUDE.md */
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
