import { ResultData, ResPage } from '@/request/modules.ts';
import { MessageChannel } from '@/api/modules/message.ts';
import channelMock from '@/assets/jsons/message-channels.json';

const CHANNEL_TYPE_MAP: Record<MessageChannel.ChannelType, string> = {
  inapp: '站内信',
  sms: '短信',
  email: '邮件',
  push: 'App Push',
  wechat: '微信消息'
} as const;

const mockData = channelMock.data;

// TODO: 替换为真实 HTTP 请求

// 获取渠道列表
export const getChannelListApi = (params: MessageChannel.ListParams): Promise<ResultData<ResPage<MessageChannel.ChannelItem>>> => {
  const { pageNum, pageSize, type, status } = params;
  let list = [...mockData.list] as MessageChannel.ChannelItem[];
  if (type) {
    list = list.filter(item => item.type === type);
  }
  if (status) {
    list = list.filter(item => item.status === status);
  }
  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pageList = list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: '成功',
    displayMsg: '',
    uniqCode: '',
    data: { list: pageList, total, pageNum, pageSize }
  });
};

// 获取渠道类型选项
export const getChannelTypeOptionsApi = (): Promise<ResultData<MessageChannel.ChannelTypeOption[]>> => {
  const options: MessageChannel.ChannelTypeOption[] = [
    { label: '站内信', value: 'inapp' },
    { label: '短信', value: 'sms' },
    { label: '邮件', value: 'email' },
    { label: 'App Push', value: 'push' },
    { label: '微信消息', value: 'wechat' }
  ];
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: options });
};

// 获取平台选项
export const getPlatformOptionsApi = (): Promise<ResultData<MessageChannel.PlatformOption[]>> => {
  const options: MessageChannel.PlatformOption[] = [
    { label: '神笔马良', value: 'shenbi' },
    { label: 'AppB', value: 'appb' }
  ];
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: options });
};

// 新建渠道
export const createChannelApi = (params: MessageChannel.CreateParams): Promise<ResultData<null>> => {
  if (params.appKey) {
    const exists = mockData.list.some(item => item.appKey === params.appKey);
    if (exists) {
      return Promise.reject(new Error('该 App Key 已存在'));
    }
  }
  const maxId = mockData.list.reduce((max, item) => Math.max(max, item.id), 0);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newItem: MessageChannel.ChannelItem = {
    id: maxId + 1,
    name: params.name,
    type: params.type,
    typeName: CHANNEL_TYPE_MAP[params.type],
    appKey: params.appKey || '-',
    platformName: params.platformName,
    status: 'active',
    templateCount: 0,
    createdAt: now,
    createdBy: '管理员',
    updatedAt: now,
    updatedBy: '管理员',
    remark: params.remark || ''
  };
  mockData.list.unshift(newItem);
  mockData.total = mockData.list.length;
  return Promise.resolve({ code: '200', msg: '消息渠道已创建', displayMsg: '', uniqCode: '', data: null });
};

// 编辑渠道
export const updateChannelApi = (params: MessageChannel.UpdateParams): Promise<ResultData<null>> => {
  const item = mockData.list.find(i => i.id === params.id);
  if (!item) {
    return Promise.reject(new Error('渠道不存在'));
  }
  if (params.appKey) {
    const exists = mockData.list.some(i => i.appKey === params.appKey && i.id !== params.id);
    if (exists) {
      return Promise.reject(new Error('该 App Key 已存在'));
    }
  }
  item.name = params.name;
  item.platformName = params.platformName;
  item.appKey = params.appKey || item.appKey;
  if (params.appSecret) {
    // AppSecret 更新逻辑（实际应加密存储）
  }
  item.remark = params.remark || '';
  item.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  item.updatedBy = '管理员';
  return Promise.resolve({ code: '200', msg: '消息渠道已更新', displayMsg: '', uniqCode: '', data: null });
};

// 启用/停用渠道
export const toggleChannelStatusApi = (params: MessageChannel.ToggleStatusParams): Promise<ResultData<null>> => {
  const item = mockData.list.find(i => i.id === params.id);
  if (!item) {
    return Promise.reject(new Error('渠道不存在'));
  }
  item.status = params.status;
  item.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  item.updatedBy = '管理员';
  const msg = params.status === 'active' ? '消息渠道已启用' : '消息渠道已停用';
  return Promise.resolve({ code: '200', msg, displayMsg: '', uniqCode: '', data: null });
};

// 删除渠道
export const deleteChannelApi = (params: MessageChannel.DeleteParams): Promise<ResultData<null>> => {
  const idx = mockData.list.findIndex(i => i.id === params.id);
  if (idx === -1) {
    return Promise.reject(new Error('渠道不存在'));
  }
  const item = mockData.list[idx];
  if (item.templateCount > 0) {
    return Promise.reject(new Error('该渠道已关联消息模板，无法删除'));
  }
  mockData.list.splice(idx, 1);
  mockData.total = mockData.list.length;
  return Promise.resolve({ code: '200', msg: '消息渠道已删除', displayMsg: '', uniqCode: '', data: null });
};

/* ===== 消息模板管理 ===== */
import { MessageTemplate } from '@/api/modules/message.ts';
import templateMock from '@/assets/jsons/message-templates.json';

const mockTemplateData = templateMock.data;

// 获取模板列表
export const getTemplateListApi = (params: MessageTemplate.ListParams): Promise<ResultData<ResPage<MessageTemplate.TemplateItem>>> => {
  const { pageNum, pageSize, name, channel, content } = params;
  let list = [...mockTemplateData.list] as MessageTemplate.TemplateItem[];
  if (name) {
    list = list.filter(item => item.name.toLowerCase().includes(name.toLowerCase()));
  }
  if (channel) {
    list = list.filter(item => item.channel === channel);
  }
  if (content) {
    list = list.filter(item => item.content.toLowerCase().includes(content.toLowerCase()));
  }
  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pageList = list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: '成功',
    displayMsg: '',
    uniqCode: '',
    data: { list: pageList, total, pageNum, pageSize }
  });
};

// 获取模板详情
export const getTemplateDetailApi = (params: MessageTemplate.DetailParams): Promise<ResultData<MessageTemplate.TemplateItem>> => {
  const item = mockTemplateData.list.find(i => i.id === params.id);
  if (!item) {
    return Promise.reject(new Error('模板不存在'));
  }
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: { ...item } as MessageTemplate.TemplateItem });
};

// 获取渠道选项
export const getTemplateChannelOptionsApi = (): Promise<ResultData<MessageTemplate.ChannelOption[]>> => {
  const options: MessageTemplate.ChannelOption[] = [
    { label: '微信推送', value: 'wechat' },
    { label: '短信', value: 'sms' },
    { label: '站内信', value: 'inapp' },
    { label: '邮件', value: 'email' },
    { label: 'App Push', value: 'push' }
  ];
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: options });
};

/* ===== 消息列表 ===== */
import { MessageRecord } from '@/api/modules/message.ts';
import messageRecordsMock from '@/assets/jsons/message-records.json';

const mockRecords = messageRecordsMock.data;

// 获取消息列表
export const getMessageListApi = (params: MessageRecord.ListParams): Promise<ResultData<ResPage<MessageRecord.MessageItem>>> => {
  const { pageNum, pageSize, userId, channel, content } = params;
  let list = [...mockRecords.list] as MessageRecord.MessageItem[];
  if (userId) {
    list = list.filter(item => item.userId === userId);
  }
  if (channel) {
    list = list.filter(item => item.channel === channel);
  }
  if (content) {
    list = list.filter(item => item.content.toLowerCase().includes(content.toLowerCase()));
  }
  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pageList = list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: '成功',
    displayMsg: '',
    uniqCode: '',
    data: { list: pageList, total, pageNum, pageSize }
  });
};

// 获取消息详情
export const getMessageDetailApi = (params: MessageRecord.DetailParams): Promise<ResultData<MessageRecord.MessageItem>> => {
  const item = mockRecords.list.find(i => i.id === params.id);
  if (!item) {
    return Promise.reject(new Error('消息不存在'));
  }
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: { ...item } as MessageRecord.MessageItem });
};

// 获取消息渠道选项
export const getMessageChannelOptionsApi = (): Promise<ResultData<MessageRecord.ChannelOption[]>> => {
  const options: MessageRecord.ChannelOption[] = [
    { label: '微信推送', value: 'wechat' },
    { label: '短信', value: 'sms' },
    { label: '站内信', value: 'inapp' },
    { label: '邮件', value: 'email' },
    { label: 'App Push', value: 'push' }
  ];
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: options });
};
