import mockData from '@/assets/jsons/finance-overview.json';
import { ResultData } from '@/request/modules';

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

export const getFinanceOverviewApi = (_params?: { appId?: string; timeRange?: string }): Promise<ResultData<FinanceOverview.OverviewData>> => {
  return Promise.resolve(mockData as unknown as ResultData<FinanceOverview.OverviewData>);
};
