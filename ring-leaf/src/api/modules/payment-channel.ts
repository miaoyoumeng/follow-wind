import http from '@/request/index';

/* ===== 支付渠道 ===== */
export declare namespace PaymentChannel {
  interface ChannelItem {
    id: number;
    name: string;
    type: 'wechat' | 'alipay';
    merchantId: string;
    merchantKey: string;
    certificateUrl: string;
    companyName: string;
    status: 'enabled' | 'disabled';
    appCount: number;
    remark: string;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
  }

  interface ListParams {
    type?: 'wechat' | 'alipay';
    pageNum: number;
    pageSize: number;
  }

  interface ListResult {
    list: ChannelItem[];
    total: number;
  }

  interface CreateParams {
    name: string;
    type: 'wechat' | 'alipay';
    merchantId: string;
    merchantKey: string;
    certificateFile?: File;
    companyName: string;
    remark?: string;
  }

  interface UpdateParams {
    id: number;
    name: string;
    merchantId: string;
    merchantKey?: string;
    certificateFile?: File;
    companyName: string;
    remark?: string;
  }
}

export const getPaymentChannelListApi = (params: PaymentChannel.ListParams) => {
  return http.get<{ list: PaymentChannel.ChannelItem[]; total: number }>('/api/admin/payment-channels', params);
};

export const createPaymentChannelApi = (data: PaymentChannel.CreateParams) => {
  return http.post('/api/admin/payment-channels', data);
};

export const updatePaymentChannelApi = (data: PaymentChannel.UpdateParams) => {
  return http.put(`/api/admin/payment-channels/${data.id}`, data);
};
