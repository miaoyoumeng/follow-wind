/** prompt 文件的执行状态：todo 待执行；running 执行中；done 已完成 */
export type PromptStatus = 'todo' | 'running' | 'done';

/** index.md 中的一行数据 */
export interface PromptIndexRow {
  /** 第一列原文（已去掉反引号与首尾空白），写入时为相对 cwd 的路径 */
  storedPath: string;
  /** 文件基名，用于在索引内唯一标识一个 prompt */
  fileName: string;
  /** 第二列记录的 md5 签名 */
  md5: string;
  /** 第三列状态 */
  status: PromptStatus;
}

/** 索引中各状态的文件数 */
export interface PromptIndexStats {
  /** 文件总数 */
  total: number;
  /** 已完成数 */
  done: number;
  /** 执行中数 */
  running: number;
  /** 待执行数 */
  todo: number;
}
