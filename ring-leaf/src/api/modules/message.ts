/* ===== 消息渠道管理 ===== */
export declare namespace MessageChannel {
  /** 渠道类型枚举 */
  type ChannelType = 'inapp' | 'sms' | 'email' | 'push' | 'wechat';

  /** 状态枚举 */
  type Status = 'active' | 'inactive';

  /** 渠道列表项 */
  interface ChannelItem {
    id: number;
    name: string;
    type: ChannelType;
    typeName: string;
    appKey: string;
    platformName: string;
    status: Status;
    templateCount: number;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    remark: string;
  }

  /** 列表查询参数 */
  interface ListParams {
    type?: ChannelType;
    status?: Status;
    pageNum: number;
    pageSize: number;
  }

  /** 新建渠道参数 */
  interface CreateParams {
    name: string;
    type: ChannelType;
    platformName: string;
    appKey?: string;
    appSecret?: string;
    remark?: string;
  }

  /** 编辑渠道参数 */
  interface UpdateParams {
    id: number;
    name: string;
    type: ChannelType;
    platformName: string;
    appKey?: string;
    appSecret?: string;
    remark?: string;
  }

  /** 切换状态参数 */
  interface ToggleStatusParams {
    id: number;
    status: Status;
  }

  /** 删除参数 */
  interface DeleteParams {
    id: number;
  }

  /** 渠道类型选项 */
  interface ChannelTypeOption {
    label: string;
    value: ChannelType;
  }

  /** 平台选项 */
  interface PlatformOption {
    label: string;
    value: string;
  }
}

/* ===== 消息模板管理 ===== */
export declare namespace MessageTemplate {
  /** 渠道类型 */
  type ChannelType = 'wechat' | 'sms' | 'inapp' | 'email' | 'push';

  /** 状态枚举 */
  type Status = 'active' | 'inactive';

  /** 模板列表项 */
  interface TemplateItem {
    id: number;
    name: string;
    productLine: string;
    scene: string;
    channel: ChannelType;
    channelName: string;
    status: Status;
    content: string;
    createdAt: string;
    arrivalCount: number;
    sendCount: number;
  }

  /** 列表查询参数 */
  interface ListParams {
    name?: string;
    channel?: ChannelType;
    content?: string;
    pageNum: number;
    pageSize: number;
  }

  /** 详情查询参数 */
  interface DetailParams {
    id: number;
  }

  /** 渠道选项 */
  interface ChannelOption {
    label: string;
    value: ChannelType;
  }
}

/* ===== 消息列表管理 ===== */
export declare namespace MessageRecord {
  /** 渠道类型 */
  type ChannelType = 'wechat' | 'sms' | 'inapp' | 'email' | 'push';

  /** 消息状态 */
  type Status = 'delivered' | 'sending' | 'failed';

  /** 消息列表项 */
  interface MessageItem {
    id: number;
    userId: string;
    userName: string;
    templateId: string;
    content: string;
    channel: ChannelType;
    channelName: string;
    status: Status;
    statusName: string;
    sentAt: string;
  }

  /** 列表查询参数 */
  interface ListParams {
    userId?: string;
    channel?: ChannelType;
    content?: string;
    pageNum: number;
    pageSize: number;
  }

  /** 详情查询参数 */
  interface DetailParams {
    id: number;
  }

  /** 渠道选项 */
  interface ChannelOption {
    label: string;
    value: ChannelType;
  }
}
