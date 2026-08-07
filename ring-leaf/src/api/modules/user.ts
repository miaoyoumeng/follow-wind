/* 今日用户相关类型 */
export declare namespace TodayUser {
  /* 核心指标 */
  interface TodayMetrics {
    registerCount: number;
    activeCount: number;
    payCount: number;
    registerCompare: number;
    activeCompare: number;
    payCompare: number;
    registerYesterday: number;
    activeYesterday: number;
    payYesterday: number;
  }

  /* 用户列表项 */
  interface UserItem {
    userId: number;
    userName: string;
    nickname: string;
    channel1: string;
    channel2: string;
    registerTime?: string;
    activeTime?: string;
    payTime?: string;
  }

  /* 用户详情 */
  interface UserDetail {
    userId: number;
    userName: string;
    nickname: string;
    phone: string;
    channel1: string;
    channel2: string;
    registerTime: string;
  }

  /* 渠道选项 */
  interface ChannelOption {
    value: string;
    label: string;
  }

  /* 趋势数据 */
  interface TrendData {
    today: number[];
    yesterday: number[];
    lastWeek: number[];
  }

  /* 列表查询参数 */
  interface ListParams {
    channelId?: string;
    pageNum: number;
    pageSize: number;
  }
}

/* ===== 用户列表 ===== */
export declare namespace UserList {
  interface UserItem {
    userId: number;
    userName: string;
    nickname: string;
    avatar: string;
    wechatNickname: string;
    wechatGender: 'male' | 'female' | 'unknown' | '';
    channel1: string;
    channel2: string;
    registerTime: string;
    status: 'normal' | 'cancelled' | 'blacklisted';
    role: string;
    phone: string;
    phoneReal?: string;
    lastActiveTime?: string;
    cancelledTime?: string;
  }

  interface ActiveListParams {
    channel1?: string;
    userId?: string;
    userName?: string;
    phone?: string;
    registerStartDate?: string;
    registerEndDate?: string;
    pageNum: number;
    pageSize: number;
  }

  interface CancelledListParams {
    userId?: string;
    userName?: string;
    phone?: string;
    cancelledStartDate?: string;
    cancelledEndDate?: string;
    pageNum: number;
    pageSize: number;
  }

  interface UserDetail {
    userId: number;
    userName: string;
    nickname: string;
    avatar: string;
    wechatNickname: string;
    wechatGender: 'male' | 'female' | 'unknown' | '';
    phone: string;
    phoneReal: string;
    channel1: string;
    channel2: string;
    registerTime: string;
    lastActiveTime: string;
    status: string;
    role: string;
  }

  interface ActionParams {
    userId: number;
  }
}

/* ===== 会员列表 ===== */
export declare namespace MemberList {
  interface MemberItem {
    memberId: number;
    userName: string;
    nickname: string;
    avatar: string;
    wechatNickname: string;
    wechatGender: 'male' | 'female' | 'unknown' | '';
    phone: string;
    channel1: string;
    registerTime: string;
    memberStatus: 'active' | 'expired';
    memberExpireDate: string;
    totalConsume: number;
    remark: string;
  }

  interface ListParams {
    channel1?: string;
    userId?: string;
    userName?: string;
    phone?: string;
    pageNum: number;
    pageSize: number;
  }

  interface MemberDetail {
    memberId: number;
    userName: string;
    nickname: string;
    avatar: string;
    wechatNickname: string;
    wechatGender: 'male' | 'female' | 'unknown' | '';
    phone: string;
    channel1: string;
    registerTime: string;
    memberType: string;
    memberStartDate: string;
    memberExpireDate: string;
    memberStatus: 'active' | 'expired';
    totalConsume: number;
    remark: string;
  }

  interface RemarkParams {
    memberId: number;
    remark: string;
  }
}

/* ===== API 函数 ===== */
import { ResultData } from '@/request/modules';
import todayUserList from '@/assets/jsons/today-user-list.json';

const mockResponse = <T>(data: T): Promise<ResultData<T>> => Promise.resolve({ code: '200', msg: '成功', data } as ResultData<T>);

export const getTodayMetricsApi = (): Promise<ResultData<TodayUser.TodayMetrics>> => {
  const { metrics } = todayUserList.data as { metrics: TodayUser.TodayMetrics };
  return mockResponse(metrics);
};

export const getTodayRegisteredListApi = (params: TodayUser.ListParams): Promise<ResultData<{ list: TodayUser.UserItem[]; total: number }>> => {
  const data = todayUserList.data as {
    registerList: { list: TodayUser.UserItem[]; total: number };
    activeList: { list: TodayUser.UserItem[]; total: number };
    payList: { list: TodayUser.UserItem[]; total: number };
  };
  let list = [...data.registerList.list];
  if (params.channelId) {
    list = list.filter(item => item.channel1 === params.channelId);
  }
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;
  return mockResponse({ list: list.slice(start, end), total: data.registerList.total });
};

export const getTodayActiveListApi = (params: TodayUser.ListParams): Promise<ResultData<{ list: TodayUser.UserItem[]; total: number }>> => {
  const data = todayUserList.data as {
    registerList: { list: TodayUser.UserItem[]; total: number };
    activeList: { list: TodayUser.UserItem[]; total: number };
    payList: { list: TodayUser.UserItem[]; total: number };
  };
  let list = [...data.activeList.list];
  if (params.channelId) {
    list = list.filter(item => item.channel1 === params.channelId);
  }
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;
  return mockResponse({ list: list.slice(start, end), total: data.activeList.total });
};

export const getTodayPayListApi = (params: TodayUser.ListParams): Promise<ResultData<{ list: TodayUser.UserItem[]; total: number }>> => {
  const data = todayUserList.data as {
    registerList: { list: TodayUser.UserItem[]; total: number };
    activeList: { list: TodayUser.UserItem[]; total: number };
    payList: { list: TodayUser.UserItem[]; total: number };
  };
  let list = [...data.payList.list];
  if (params.channelId) {
    list = list.filter(item => item.channel1 === params.channelId);
  }
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;
  return mockResponse({ list: list.slice(start, end), total: data.payList.total });
};

export const getTodayUserDetailApi = (userId: number): Promise<ResultData<TodayUser.UserDetail>> => {
  const data = todayUserList.data as {
    registerList: { list: TodayUser.UserItem[] };
    activeList: { list: TodayUser.UserItem[] };
    payList: { list: TodayUser.UserItem[] };
  };
  const allUsers = [...data.registerList.list, ...data.activeList.list, ...data.payList.list];
  const user = allUsers.find(u => u.userId === userId);
  if (user) {
    return mockResponse<TodayUser.UserDetail>({
      userId: user.userId,
      userName: user.userName,
      nickname: user.nickname,
      phone: '138****5678',
      channel1: user.channel1,
      channel2: user.channel2,
      registerTime: user.registerTime || ''
    });
  }
  return mockResponse<TodayUser.UserDetail>({
    userId,
    userName: `u_${userId}`,
    nickname: '未知用户',
    phone: '***',
    channel1: '-',
    channel2: '-',
    registerTime: '-'
  });
};

export const getChannelOptionsApi = (): Promise<ResultData<TodayUser.ChannelOption[]>> => {
  const { channelOptions } = todayUserList.data as { channelOptions: TodayUser.ChannelOption[] };
  return mockResponse(channelOptions);
};

export const getTrendDataApi = (type: 'register' | 'active' | 'pay'): Promise<ResultData<TodayUser.TrendData>> => {
  const data = todayUserList.data as {
    trendData: {
      register: TodayUser.TrendData;
      active: TodayUser.TrendData;
      pay: TodayUser.TrendData;
    };
  };
  return mockResponse(data.trendData[type]);
};

/* ===== 个人中心 ===== */
export declare namespace Profile {
  interface ProfileInfo {
    userId: number;
    userName: string;
    name: string;
    phone: string;
    wechatNickname: string;
    wechatId: string;
    passwordSet: boolean;
    role: string;
    channels: string[];
    joinDate: string;
    tenure: string;
  }

  interface OperationLog {
    id: number;
    time: string;
    type: string;
    content: string;
  }
}

/* ===== 会员列表 API ===== */
import memberListData from '@/assets/jsons/member-list.json';

export const getMemberListApi = (params: MemberList.ListParams): Promise<ResultData<{ list: MemberList.MemberItem[]; total: number }>> => {
  const raw = memberListData.data as { list: MemberList.MemberItem[]; total: number };
  let list = [...raw.list];

  if (params.channel1) {
    list = list.filter(item => item.channel1 === params.channel1);
  }
  if (params.userId) {
    list = list.filter(item => String(item.memberId).includes(params.userId!));
  }
  if (params.userName) {
    list = list.filter(item => item.userName.toLowerCase().includes(params.userName!.toLowerCase()));
  }
  if (params.phone) {
    list = list.filter(item => item.phone.includes(params.phone!));
  }

  const total = list.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;

  return mockResponse({ list: list.slice(start, end), total });
};

export const updateMemberRemarkApi = (_params: MemberList.RemarkParams): Promise<ResultData<boolean>> => {
  return mockResponse(true);
};

export const getMemberDetailApi = (memberId: number): Promise<ResultData<MemberList.MemberDetail>> => {
  const raw = memberListData.data as { list: MemberList.MemberItem[] };
  const member = raw.list.find(m => m.memberId === memberId);
  if (member) {
    return mockResponse<MemberList.MemberDetail>({
      memberId: member.memberId,
      userName: member.userName,
      nickname: member.nickname,
      avatar: member.avatar,
      wechatNickname: member.wechatNickname,
      wechatGender: member.wechatGender,
      phone: member.phone,
      channel1: member.channel1,
      registerTime: member.registerTime,
      memberType: '年卡',
      memberStartDate: '2026-01-01',
      memberExpireDate: member.memberExpireDate,
      memberStatus: member.memberStatus,
      totalConsume: member.totalConsume,
      remark: member.remark
    });
  }
  return mockResponse<MemberList.MemberDetail>({} as MemberList.MemberDetail);
};

/* ===== 会员详情 ===== */
export declare namespace MemberDetail {
  interface RemarkItem {
    id: number;
    operatorName: string;
    content: string;
    operateTime: string;
  }

  interface RemarkListParams {
    memberId: number;
    pageNum: number;
    pageSize: number;
  }

  interface OrderItem {
    orderId: string;
    orderTime: string;
    productName: string;
    orderAmount: number;
    payStatus: 'paid' | 'unpaid' | 'refunded';
    payMethod: string;
  }

  interface OrderListParams {
    memberId: number;
    payStatus?: string;
    pageNum: number;
    pageSize: number;
  }

  interface LoginItem {
    id: number;
    loginTime: string;
    device: string;
    ip: string;
    loginMethod: string;
    loginStatus: 'success' | 'fail';
  }

  interface LoginListParams {
    memberId: number;
    pageNum: number;
    pageSize: number;
  }

  interface RemarkSaveParams {
    memberId: number;
    content: string;
  }
}

import memberRemarkListData from '@/assets/jsons/member-remark-list.json';
import memberOrderListData from '@/assets/jsons/member-order-list.json';
import memberLoginListData from '@/assets/jsons/member-login-list.json';

export const getMemberRemarkListApi = (
  params: MemberDetail.RemarkListParams
): Promise<ResultData<{ list: MemberDetail.RemarkItem[]; total: number }>> => {
  const raw = memberRemarkListData.data as { list: MemberDetail.RemarkItem[]; total: number };
  const list = raw.list;
  const total = list.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;
  return mockResponse({ list: list.slice(start, end), total });
};

export const saveMemberRemarkApi = (_params: MemberDetail.RemarkSaveParams): Promise<ResultData<boolean>> => {
  return mockResponse(true);
};

export const getMemberOrderListApi = (
  params: MemberDetail.OrderListParams
): Promise<ResultData<{ list: MemberDetail.OrderItem[]; total: number }>> => {
  const raw = memberOrderListData.data as { list: MemberDetail.OrderItem[]; total: number };
  let list = [...raw.list];
  if (params.payStatus && params.payStatus !== 'all') {
    list = list.filter(item => item.payStatus === params.payStatus);
  }
  const total = list.length;
  const start = (params.pageNum - 1) * params.pageSize;
  const end = start + params.pageSize;
  return mockResponse({ list: list.slice(start, end), total });
};

export const getMemberLoginListApi = (
  _params: MemberDetail.LoginListParams
): Promise<ResultData<{ list: MemberDetail.LoginItem[]; total: number }>> => {
  const raw = memberLoginListData.data as { list: MemberDetail.LoginItem[]; total: number };
  return mockResponse({ list: raw.list, total: raw.total });
};
