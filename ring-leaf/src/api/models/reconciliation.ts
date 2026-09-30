/* eslint-disable @typescript-eslint/no-namespace -- 项目架构规范要求类型声明使用 declare namespace，见 CLAUDE.md */
import http from '@/request';
import { type ResultData } from '@/request/modules';

export declare namespace Reconciliation {
  type Channel = 'wechat' | 'alipay';
  type Status = 'matched' | 'mismatched';
  type DiffReason = 'platform_only' | 'system_only' | 'amount_diff';

  interface ReconciliationItem {
    id: number;
    reconciliationDate: string;
    channel: Channel;
    channelName: string;
    systemOrderCount: number;
    systemAmount: number;
    channelOrderCount: number;
    channelAmount: number;
    diffAmount: number;
    status: Status;
    statusName: string;
    createdAt: string;
  }

  interface ListParams {
    reconciliationDate?: string;
    channel?: Channel;
    status?: Status;
    pageNum: number;
    pageSize: number;
  }

  interface ListResult {
    list: ReconciliationItem[];
    total: number;
  }

  interface SummaryResult {
    todayReconciliationCount: number;
    matchedAmount: number;
    mismatchCount: number;
  }

  interface ReconciliationDetail {
    reconciliationDate: string;
    channel: Channel;
    channelName: string;
    systemOrderCount: number;
    systemAmount: number;
    channelOrderCount: number;
    channelAmount: number;
    diffAmount: number;
    status: Status;
    statusName: string;
  }

  interface DiffItem {
    id: number;
    orderNo: string;
    platformAmount: number;
    systemAmount: number;
    diffReason: DiffReason;
    diffReasonName: string;
  }

  interface DiffListResult {
    list: DiffItem[];
    total: number;
  }

  interface UploadParams {
    channel: Channel;
    reconciliationDate: string;
    file: File;
  }
}

export const getReconciliationListApi = (
  params: Reconciliation.ListParams
): Promise<ResultData<{ list: Reconciliation.ReconciliationItem[]; total: number }>> => {
  return http.get<{ list: Reconciliation.ReconciliationItem[]; total: number }>('/api/admin/reconciliations', params);
};

export const getReconciliationSummaryApi = (): Promise<ResultData<Reconciliation.SummaryResult>> => {
  return http.get<Reconciliation.SummaryResult>('/api/admin/reconciliations/summary');
};

export const getReconciliationDetailApi = (id: number): Promise<ResultData<Reconciliation.ReconciliationDetail>> => {
  return http.get<Reconciliation.ReconciliationDetail>(`/api/admin/reconciliations/${id}`);
};

export const getReconciliationDiffApi = (
  id: number,
  params: { pageNum: number; pageSize: number }
): Promise<ResultData<Reconciliation.DiffListResult>> => {
  return http.get<Reconciliation.DiffListResult>(`/api/admin/reconciliations/${id}/diffs`, params);
};

export const uploadReconciliationFileApi = (data: Reconciliation.UploadParams): Promise<ResultData<unknown>> => {
  const formData = new FormData();
  formData.append('channel', data.channel);
  formData.append('reconciliationDate', data.reconciliationDate);
  formData.append('file', data.file);
  return http.post('/api/admin/reconciliations/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const executeReconciliationApi = (params: { channel: Reconciliation.Channel; reconciliationDate: string }): Promise<ResultData<unknown>> => {
  return http.post('/api/admin/reconciliations/execute', params);
};
