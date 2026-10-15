import type { PromptRunOutcome } from '../pipe';

/** IPC 方法常量 */
export const IPC_METHODS = {
  ipcServerExit: 'ipcServerExit',
  ipcDispatch: 'ipcDispatch',
  ipcPaneRolling: 'ipcPaneRolling',
  ipcPaneFailure: 'ipcPaneFailure',
  ipcPrompt: 'ipcPrompt',
  ipcPaneStatus: 'ipcPaneStatus'
} as const;

/** IPC 方法名称 */
export type IpcMethod = (typeof IPC_METHODS)[keyof typeof IPC_METHODS];

/** IPC 请求消息 */
export interface IpcRequest {
  /** 请求唯一 ID，用于匹配响应 */
  id: string;
  /** 方法名 */
  method: IpcMethod;
  /** 方法参数 */
  params?: unknown;
}

/** IPC 响应消息 */
export interface IpcResponse {
  /** 对应请求 ID */
  id: string;
  /** 是否成功 */
  success: boolean;
  /** 成功时的返回数据 */
  data?: unknown;
  /** 失败时的错误信息 */
  error?: string;
}

/** 处理 IPC 请求的选项 */
export interface HandleMessageOptions {
  /** exit 方法被调用时的回调，用于触发 daemon 进程优雅关闭 */
  onExit?: () => void;
  /** 注册「连接关闭」监听，用于延迟响应期间感知客户端断开 */
  onConnectionClose?: (listener: () => void) => void;
}

/** ipcDispatch IPC 请求参数 */
export interface DispatchParams {
  session: string;
  window: string;
  paneIndex: number;
  prompt: string;
}

/** ipcPaneRolling IPC 请求参数 */
export interface PaneRollingParams {
  session: string;
  window: string;
  paneIndex: number;
}

/** ipcPaneFailure IPC 请求参数 */
export interface PaneFailureParams {
  session: string;
  window: string;
  paneIndex: number;
}

/** ipcPrompt IPC 请求参数 */
export interface PromptParams {
  session: string;
  window: string;
  paneIndex: number;
  prompt: string;
  /** 等待 Claude Stop 的超时毫秒数 */
  timeoutMs: number;
}

/** ipcPaneStatus IPC 请求参数 */
export interface PaneStatusParams {
  session: string;
  window: string;
  paneIndex: number;
}

/** ipcPrompt 的响应数据 */
export interface PromptResultData {
  /** 独占执行结果 */
  outcome: PromptRunOutcome;
}
