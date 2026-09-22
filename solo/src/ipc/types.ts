/** IPC 方法常量 */
export const IPC_METHODS = {
  registerTask: 'registerTask',
  listTasks: 'listTasks',
  updateTaskState: 'updateTaskState',
  exit: 'exit'
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

/** handleMessage 选项 */
export interface HandleMessageOptions {
  /** exit 方法被调用时的回调，用于触发 daemon 进程优雅关闭 */
  onExit?: () => void;
}

/** registerTask IPC 请求参数 */
export interface RegisterTaskParams {
  type: 'local_bash' | 'local_agent' | 'dream';
  pid?: number;
  agentName?: string;
  session?: string;
  window?: string;
  paneIndex?: number;
}
