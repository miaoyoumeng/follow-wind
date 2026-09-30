/* eslint-disable @typescript-eslint/no-namespace -- 项目架构规范要求类型声明使用 declare namespace，见 CLAUDE.md */
import http from '@/request';
import { type ResultData } from '@/request/modules';

export declare namespace SettlementFlow {
  type ConfirmMethod = 'daily' | 'once';
  type StrategyStatus = 'active' | 'inactive';
  type TaskResult = 'success' | 'failed';

  interface StrategyItem {
    id: number;
    name: string;
    appId: string;
    appName: string;
    skus: string[];
    confirmMethod: ConfirmMethod;
    confirmMethodName: string;
    effectiveDate: string;
    status: StrategyStatus;
    statusName: string;
    createdAt: string;
  }

  interface FlowItem {
    id: number;
    flowNo: string;
    orderNo: string;
    userId: string;
    userName: string;
    appId: string;
    appName: string;
    sku: string;
    confirmMethod: ConfirmMethod;
    confirmMethodName: string;
    confirmAmount: number;
    cumulativeAmount: number;
    payAmount: number;
    confirmDate: string;
    strategyName: string;
  }

  interface TaskItem {
    id: number;
    executeTime: string;
    result: TaskResult;
    resultName: string;
    processCount: number;
    confirmAmount: number;
    errorReason: string;
  }

  interface StrategyForm {
    id?: number;
    name: string;
    appId: string;
    skus: string[];
    confirmMethod: ConfirmMethod;
    effectiveDate: string;
  }

  interface ListParams {
    appId?: string;
    sku?: string;
    confirmDate?: string;
    orderNo?: string;
    pageNum: number;
    pageSize: number;
  }

  interface ListResult {
    list: FlowItem[];
    total: number;
  }

  interface StrategyListResult {
    list: StrategyItem[];
    total: number;
  }

  interface TaskListResult {
    list: TaskItem[];
    total: number;
  }

  interface SummaryResult {
    todayConfirmCount: number;
    todayConfirmAmount: number;
    cumulativeConfirmAmount: number;
  }

  interface FlowDetail {
    confirmDate: string;
    orderNo: string;
    userName: string;
    appName: string;
    sku: string;
    confirmMethod: ConfirmMethod;
    confirmMethodName: string;
    confirmAmount: number;
    cumulativeAmount: number;
    payAmount: number;
    strategyName: string;
  }
}

/* ===== 确收策略 API ===== */

export const getStrategyListApi = (params: {
  appId?: string;
  pageNum: number;
  pageSize: number;
}): Promise<ResultData<{ list: SettlementFlow.StrategyItem[]; total: number }>> => {
  return http.get<{ list: SettlementFlow.StrategyItem[]; total: number }>('/api/admin/settlement-strategies', params);
};

export const createStrategyApi = (data: SettlementFlow.StrategyForm): Promise<ResultData<unknown>> => {
  return http.post('/api/admin/settlement-strategies', data);
};

export const updateStrategyApi = (id: number, data: SettlementFlow.StrategyForm): Promise<ResultData<unknown>> => {
  return http.put(`/api/admin/settlement-strategies/${id}`, data);
};

export const toggleStrategyApi = (id: number): Promise<ResultData<unknown>> => {
  return http.put(`/api/admin/settlement-strategies/${id}/toggle`);
};

/* ===== 确收流水 API ===== */

export const getSettlementFlowListApi = (
  params: SettlementFlow.ListParams
): Promise<ResultData<{ list: SettlementFlow.FlowItem[]; total: number }>> => {
  return http.get<{ list: SettlementFlow.FlowItem[]; total: number }>('/api/admin/settlement-flows', params);
};

export const getSettlementFlowSummaryApi = (): Promise<ResultData<SettlementFlow.SummaryResult>> => {
  return http.get<SettlementFlow.SummaryResult>('/api/admin/settlement-flows/summary');
};

export const getSettlementFlowDetailApi = (id: number): Promise<ResultData<SettlementFlow.FlowDetail>> => {
  return http.get<SettlementFlow.FlowDetail>(`/api/admin/settlement-flows/${id}`);
};

/* ===== 确收任务执行记录 API ===== */

export const getTaskListApi = (params: { pageNum: number; pageSize: number }): Promise<ResultData<SettlementFlow.TaskListResult>> => {
  return http.get<SettlementFlow.TaskListResult>('/api/admin/settlement-tasks', params);
};
