/* eslint-disable @typescript-eslint/no-namespace -- 项目架构规范要求类型声明使用 declare namespace，见 CLAUDE.md */
declare namespace ProductLineModel {
  /** 产品线类型 */
  type ProductType = 'app' | 'mini-program' | 'web';

  /** 产品线状态 */
  type ProductStatus = 'enabled' | 'disabled';

  /** 产品线列表项 */
  interface ProductLineItem {
    id: number;
    name: string;
    code: string;
    type: ProductType;
    status: ProductStatus;
    icon: string;
    description: string;
    skuCount: number;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
  }

  /** 列表查询参数 */
  interface ListParams {
    type?: ProductType;
    name?: string;
    pageNum: number;
    pageSize: number;
  }

  /** 分页列表响应 */
  interface ListResult {
    list: ProductLineItem[];
    total: number;
  }

  /** 新建参数 */
  interface CreateParams {
    name: string;
    code: string;
    type: ProductType;
    icon?: string;
    description?: string;
  }

  /** 更新参数 */
  interface UpdateParams {
    id: number;
    name: string;
    type: ProductType;
    icon?: string;
    description?: string;
  }

  /** 表单数据（前端本地使用） */
  interface ProductLineFormData {
    id: number;
    name: string;
    code: string;
    type: ProductType | '';
    icon: string;
    description: string;
  }

  /** 支付渠道项 */
  interface PayChannelItem {
    id: number;
    productLineId: number;
    channelType: 'wechat' | 'alipay';
    channelName: string;
    merchantId: string;
    companyName: string;
    status: 'enabled' | 'disabled';
  }

  /** 属性项 */
  interface AttributeItem {
    id: number;
    productLineId: number;
    name: string;
    value: string;
  }

  /** 属性表单数据 */
  interface AttributeFormData {
    id: number;
    name: string;
    value: string;
  }
}

export type { ProductLineModel };
