import type { StopReason } from '@anthropic-ai/sdk/resources/messages';

/** 扩展 stop_reason：在 SDK 标准值基础上追加 tool_deferred */
export type ExtendedStopReason = StopReason | 'tool_deferred';

/** 待处理的工具调用信息 */
export interface DeferredToolUse {
  readonly id: string;
  readonly name: string;
  readonly input: Record<string, unknown>;
}

/** 人工决策原因：API 信号 + 6 种策略 */
export type DecisionReason =
  | 'tool_deferred'
  | 'refusal'
  | 'sensitive_tool'
  | 'structured_question'
  | 'permission_sandbox'
  | 'decision_classifier'
  | 'plan_confirm_execute'
  | 'conflict_exposure'
  | 'failure_visibility'
  | null;

/** needsHumanDecision 的返回值 */
export interface HumanDecisionResult {
  readonly requiresHuman: boolean;
  readonly reason: DecisionReason;
  readonly deferredTool?: DeferredToolUse;
  readonly message: string;
}

/** 单模型单日 token 消耗统计 */
export interface UsageTotals {
  input_cached: number;
  input_missed: number;
  output: number;
}

/** 按日期 → 模型索引的 usage 统计 */
export type UsageData = Record<string, Record<string, UsageTotals>>;

/**
 * 决策策略的输入上下文。
 * 每个策略按需使用其中的字段，未提供的字段视为不适用。
 */
export interface DecisionContext {
  /** Claude 当前输出的文本内容 */
  readonly content: string;
  /** 当前涉及的 Claude 工作目录 */
  readonly cwd?: string;
  /** 可选元数据，供决策分类器、权限沙盒等策略使用 */
  readonly metadata?: {
    /** 是否存在已有约定 */
    readonly hasConvention?: boolean;
    /** 操作是否可逆 */
    readonly isReversible?: boolean;
    /** 是否存在冲突选项 */
    readonly hasConflict?: boolean;
    /** 是否有充分上下文 */
    readonly hasContext?: boolean;
    /** 当前涉及的工具名称 */
    readonly toolName?: string;
  };
}

/**
 * 决策策略接口（责任链模式）。
 * 匹配时返回策略名称（如 'structuredQuestion'），不匹配返回 null。
 */
export type DecisionStrategy = (context: DecisionContext) => string | null;
