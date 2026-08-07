import { ResultData, ResPage } from '@/request/modules.ts';
import { TodayUser, UserList, MemberList, Profile } from '@/api/modules/user.ts';

import todayMetrics from '@/assets/jsons/today-metrics.json';
import userListMock from '@/assets/jsons/user-list.json';
import todayRegisteredList from '@/assets/jsons/today-registered.json';
import todayActiveList from '@/assets/jsons/today-active.json';
import todayPayList from '@/assets/jsons/today-pay.json';
import todayUserDetail from '@/assets/jsons/today-user-detail.json';
import channelOptions from '@/assets/jsons/app-options.json';
import trendData from '@/assets/jsons/trend-data.json';
import memberListMock from '@/assets/jsons/member-list.json';
import profileInfo from '@/assets/jsons/profile-info.json';
import operationLogs from '@/assets/jsons/operation-logs.json';

// TODO: 替换为真实 HTTP 请求
// 获取核心指标
export const getTodayMetricsApi = (): Promise<ResultData<TodayUser.TodayMetrics>> => {
  return Promise.resolve(todayMetrics as unknown as ResultData<TodayUser.TodayMetrics>);
};

// 获取注册用户列表
export const getTodayRegisteredListApi = (params: TodayUser.ListParams): Promise<ResultData<ResPage<TodayUser.UserItem>>> => {
  const { pageNum, pageSize } = params;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = todayRegisteredList.data.list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: todayRegisteredList.msg,
    displayMsg: '',
    uniqCode: '',
    data: { ...todayRegisteredList.data, list, pageNum, pageSize }
  } as unknown as ResultData<ResPage<TodayUser.UserItem>>);
};

// 获取活跃用户列表
export const getTodayActiveListApi = (params: TodayUser.ListParams): Promise<ResultData<ResPage<TodayUser.UserItem>>> => {
  const { pageNum, pageSize } = params;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = todayActiveList.data.list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: todayActiveList.msg,
    displayMsg: '',
    uniqCode: '',
    data: { ...todayActiveList.data, list, pageNum, pageSize }
  } as unknown as ResultData<ResPage<TodayUser.UserItem>>);
};

// 获取支付用户列表
export const getTodayPayListApi = (params: TodayUser.ListParams): Promise<ResultData<ResPage<TodayUser.UserItem>>> => {
  const { pageNum, pageSize } = params;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = todayPayList.data.list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: todayPayList.msg,
    displayMsg: '',
    uniqCode: '',
    data: { ...todayPayList.data, list, pageNum, pageSize }
  } as unknown as ResultData<ResPage<TodayUser.UserItem>>);
};

// 获取用户详情
export const getTodayUserDetailApi = (_userId: number): Promise<ResultData<TodayUser.UserDetail>> => {
  return Promise.resolve(todayUserDetail as unknown as ResultData<TodayUser.UserDetail>);
};

// 获取一级渠道筛选选项
export const getChannelOptionsApi = (): Promise<ResultData<TodayUser.ChannelOption[]>> => {
  return Promise.resolve(channelOptions as unknown as ResultData<TodayUser.ChannelOption[]>);
};

// 获取趋势数据
type TrendKey = 'register' | 'active' | 'pay';
export const getTrendDataApi = (type: TrendKey): Promise<ResultData<TodayUser.TrendData>> => {
  return Promise.resolve(trendData[type] as unknown as ResultData<TodayUser.TrendData>);
};

/* ===== 用户列表 ===== */

// 获取有效用户列表
export const getActiveUserListApi = (params: UserList.ActiveListParams): Promise<ResultData<ResPage<UserList.UserItem>>> => {
  const { pageNum, pageSize, channel1, userId, userName, phone, registerStartDate, registerEndDate } = params;
  let list = [...userListMock.data.activeList];
  if (channel1 && channel1 !== 'all') {
    list = list.filter(item => item.channel1 === channel1);
  }
  if (userId) {
    list = list.filter(item => String(item.userId).includes(userId));
  }
  if (userName) {
    list = list.filter(item => item.userName.includes(userName) || item.nickname.includes(userName));
  }
  if (phone) {
    list = list.filter(item => item.phone.includes(phone));
  }
  if (registerStartDate) {
    list = list.filter(item => item.registerTime >= registerStartDate);
  }
  if (registerEndDate) {
    list = list.filter(item => item.registerTime <= registerEndDate + ' 23:59:59');
  }
  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pagedList = list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: userListMock.msg,
    displayMsg: '',
    uniqCode: '',
    data: { list: pagedList, total, pageNum, pageSize }
  } as unknown as ResultData<ResPage<UserList.UserItem>>);
};

// 获取注销用户列表
export const getCancelledUserListApi = (params: UserList.CancelledListParams): Promise<ResultData<ResPage<UserList.UserItem>>> => {
  const { pageNum, pageSize, userId, userName, phone, cancelledStartDate, cancelledEndDate } = params;
  let list = [...userListMock.data.cancelledList];
  if (userId) {
    list = list.filter(item => String(item.userId).includes(userId));
  }
  if (userName) {
    list = list.filter(item => item.userName.includes(userName) || item.nickname.includes(userName));
  }
  if (phone) {
    list = list.filter(item => item.phone.includes(phone));
  }
  if (cancelledStartDate) {
    list = list.filter(item => item.cancelledTime && item.cancelledTime >= cancelledStartDate);
  }
  if (cancelledEndDate) {
    list = list.filter(item => item.cancelledTime && item.cancelledTime <= cancelledEndDate + ' 23:59:59');
  }
  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pagedList = list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: userListMock.msg,
    displayMsg: '',
    uniqCode: '',
    data: { list: pagedList, total, pageNum, pageSize }
  } as unknown as ResultData<ResPage<UserList.UserItem>>);
};

// 获取用户详情
export const getUserDetailApi = (userId: number): Promise<ResultData<UserList.UserDetail>> => {
  const allUsers = [...userListMock.data.activeList, ...userListMock.data.cancelledList];
  const user = allUsers.find(u => u.userId === userId);
  if (user) {
    return Promise.resolve({
      code: '200',
      msg: '成功',
      displayMsg: '',
      uniqCode: '',
      data: {
        userId: user.userId,
        userName: user.userName,
        nickname: user.nickname,
        avatar: user.avatar,
        wechatNickname: user.wechatNickname || '—',
        wechatGender: user.wechatGender || '',
        phone: user.phone,
        phoneReal: user.phoneReal || user.phone,
        channel1: user.channel1,
        channel2: user.channel2,
        registerTime: user.registerTime,
        lastActiveTime: user.lastActiveTime || '—',
        status: user.status,
        role: user.role
      } as UserList.UserDetail
    });
  }
  return Promise.resolve({
    code: '200',
    msg: '成功',
    displayMsg: '',
    uniqCode: '',
    data: {
      userId,
      userName: `user_${userId}`,
      nickname: '未知用户',
      avatar: '',
      wechatNickname: '—',
      wechatGender: '',
      phone: '***',
      phoneReal: '***',
      channel1: '—',
      channel2: '—',
      registerTime: '—',
      lastActiveTime: '—',
      status: '—',
      role: '—'
    } as UserList.UserDetail
  });
};

// 注销用户
export const cancelUserApi = (_params: UserList.ActionParams): Promise<ResultData<null>> => {
  return Promise.resolve({ code: '200', msg: '注销成功', displayMsg: '', uniqCode: '', data: null });
};

// 拉黑用户
export const blacklistUserApi = (_params: UserList.ActionParams): Promise<ResultData<null>> => {
  return Promise.resolve({ code: '200', msg: '拉黑成功', displayMsg: '', uniqCode: '', data: null });
};

/* ===== 会员列表 ===== */

// 获取会员列表
export const getMemberListApi = (params: MemberList.ListParams): Promise<ResultData<ResPage<MemberList.MemberItem>>> => {
  const { pageNum, pageSize } = params;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = memberListMock.data.list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: memberListMock.msg,
    displayMsg: '',
    uniqCode: '',
    data: { ...memberListMock.data, list, pageNum, pageSize }
  } as unknown as ResultData<ResPage<MemberList.MemberItem>>);
};

// 更新会员备注
export const updateMemberRemarkApi = (params: MemberList.RemarkParams): Promise<ResultData<null>> => {
  // 更新 mock 数据中的备注
  const member = memberListMock.data.list.find(m => m.memberId === params.memberId);
  if (member) {
    member.remark = params.remark;
  }
  return Promise.resolve({ code: '200', msg: '备注已更新', displayMsg: '', uniqCode: '', data: null });
};

/* ===== 个人中心 ===== */

// 获取个人信息
export const getProfileInfoApi = (): Promise<ResultData<Profile.ProfileInfo>> => {
  return Promise.resolve(profileInfo as unknown as ResultData<Profile.ProfileInfo>);
};

// 获取操作日志（最近5条）
export const getRecentLogsApi = (): Promise<ResultData<{ list: Profile.OperationLog[]; total: number }>> => {
  return Promise.resolve(operationLogs as unknown as ResultData<{ list: Profile.OperationLog[]; total: number }>);
};

// 获取全部操作日志（最多50条）
export const getAllLogsApi = (): Promise<ResultData<Profile.OperationLog[]>> => {
  return Promise.resolve(operationLogs.data.list as unknown as ResultData<Profile.OperationLog[]>);
};

// 更换微信（扫码绑定）
export const changeWechatApi = (): Promise<ResultData<null>> => {
  return Promise.resolve({ code: '200', msg: '微信账号已更换', displayMsg: '', uniqCode: '', data: null });
};

// 绑定手机号
export const bindPhoneApi = (_params: { phone: string; code: string }): Promise<ResultData<null>> => {
  return Promise.resolve({ code: '200', msg: '手机号已更新', displayMsg: '', uniqCode: '', data: null });
};

// 获取短信验证码
export const getSmsCodeApi = (_phone: string): Promise<ResultData<null>> => {
  return Promise.resolve({ code: '200', msg: '验证码已发送', displayMsg: '', uniqCode: '', data: null });
};

// 设置/修改密码
export const setPasswordApi = (_params: { password: string }): Promise<ResultData<null>> => {
  return Promise.resolve({ code: '200', msg: '密码已设置', displayMsg: '', uniqCode: '', data: null });
};
