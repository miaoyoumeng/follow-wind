/* eslint-disable @typescript-eslint/no-namespace -- 项目架构规范要求类型声明使用 declare namespace，见 CLAUDE.md */
import mockData from '@/assets/mocks/finance-overview.json';
import { type ResultData } from '@/request/modules';

// TODO: 后端接口就绪后，替换为 http.get 调用
// import http from '@/request/index';

export declare namespace FinanceOverview {
  interface TodayMetrics {
    todayRevenue: number;
    todayConfirmed: number;
    todayRefund: number;
    todayOrder: number;
  }

  interface MonthSummary {
    monthRevenue: number;
    monthConfirmed: number;
    monthRefund: number;
    pendingConfirmed: number;
  }

  interface TrendItem {
    date: string;
    revenue: number;
    confirmed: number;
    refund: number;
  }

  interface AppRevenueItem {
    appName: string;
    revenue: number;
    percentage: number;
    confirmed: number;
    refund: number;
  }

  interface OverviewData {
    todayMetrics: TodayMetrics;
    monthSummary: MonthSummary;
    trendData: TrendItem[];
    appRevenueList: AppRevenueItem[];
  }
}

/** App 筛选值 → mock 数据中的 App 名称（对应页面下拉项的 value） */
const FILTER_APP_NAME_MAP: Record<string, string> = { shenbi: '神笔马良', 'app-b': 'App B' };

/** 时间范围筛选值 → 趋势图展示的天数 */
const FILTER_RANGE_DAYS: Record<string, number> = { today: 1, week: 7, month: 30 };

export const getFinanceOverviewApi = (params?: { appId?: string; timeRange?: string }): Promise<ResultData<FinanceOverview.OverviewData>> => {
  const base = mockData.data as unknown as FinanceOverview.OverviewData;
  const appName = params?.appId ? FILTER_APP_NAME_MAP[params.appId] : undefined;
  const days = FILTER_RANGE_DAYS[params?.timeRange ?? 'month'] ?? 30;
  // 按 App 过滤营收明细；趋势图按所选时间范围截取末尾若干天
  const appRevenueList = appName ? base.appRevenueList.filter(item => item.appName === appName) : base.appRevenueList;
  const data: FinanceOverview.OverviewData = { ...base, trendData: base.trendData.slice(-days), appRevenueList };
  return Promise.resolve({ ...mockData, data } as unknown as ResultData<FinanceOverview.OverviewData>);
};
