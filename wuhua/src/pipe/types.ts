/**
 * 命令行指令
 */
export interface Instruct {
  /** 要执行的内容 */
  prompt: string;
  /** 创建时间（UTC，ISO 8601 格式） */
  createdAt: string;
  /** 已失败重试次数（缺省视为 0） */
  retryCount?: number;
}
