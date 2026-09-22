import type {
  DecisionContext,
  DecisionStrategy,
  DeferredToolUse,
  ExtendedStopReason,
  HumanDecisionResult
} from './types';
import { structuredQuestion } from './decision/structuredQuestion';
import { permissionSandbox } from './decision/permissionSandbox';
// import { decisionClassifier } from './decision/decisionClassifier';
// import { planConfirmExecute } from './decision/planConfirmExecute';
// import { conflictExposure } from './decision/conflictExposure';
// import { failureVisibility } from './decision/failureVisibility';

export { trustFolder } from './trust';

/** 6 种文本策略，按优先级排列 */
const STRATEGIES: readonly DecisionStrategy[] = [
  structuredQuestion,
  // decisionClassifier,
  // planConfirmExecute,
  // conflictExposure,
  // failureVisibility,
  permissionSandbox
];

/**
 * 检测 Claude 输出是否需要人工介入（责任链模式）。
 * 依次运行 6 种策略，返回第一个匹配的策略名称；全不匹配返回 null 并记录 debug 日志。
 * @param context 决策上下文
 * @returns 匹配的策略名称（如 'structuredQuestion'），或 null
 */
export function detectIntervention(context: DecisionContext): string | null {
  for (const strategy of STRATEGIES) {
    const name = strategy(context);
    if (name !== null) return name;
  }
  return null;
}

/**
 * 判断 Claude 的响应是否需要人工决策（API 信号层）。
 * 基于 stop_reason、敏感工具集等 API 级信号判断。
 *
 * @param stopReason  响应中的 stop_reason
 * @param deferredToolUse  可选：当 stop_reason 为 tool_deferred 时携带的待处理工具信息
 * @param sensitiveTools  可选：需要人工批准的工具名称集合
 */
export function needsHumanDecision(
  stopReason: ExtendedStopReason | null,
  deferredToolUse?: DeferredToolUse,
  sensitiveTools: Set<string> = new Set()
): HumanDecisionResult {
  if (stopReason === 'tool_deferred') {
    return {
      requiresHuman: true,
      reason: 'tool_deferred',
      deferredTool: deferredToolUse,
      message: `工具 "${deferredToolUse?.name ?? 'unknown'}" 被推迟，等待人工决策。`
    };
  }

  if (stopReason === 'refusal') {
    return {
      requiresHuman: true,
      reason: 'refusal',
      message: 'Claude 拒绝回答，建议人工复核后决定是否重试或换模型。'
    };
  }

  if (stopReason === 'tool_use' && deferredToolUse && sensitiveTools.has(deferredToolUse.name)) {
    return {
      requiresHuman: true,
      reason: 'sensitive_tool',
      deferredTool: deferredToolUse,
      message: `工具 "${deferredToolUse.name}" 属于敏感操作，需要人工批准。`
    };
  }

  return {
    requiresHuman: false,
    reason: null,
    message: '无需人工决策，可按标准流程处理。'
  };
}

export {
  structuredQuestion,
  // decisionClassifier,
  // planConfirmExecute,
  // conflictExposure,
  // failureVisibility,
  permissionSandbox
};

export type {
  DecisionStrategy,
  DecisionContext,
  ExtendedStopReason,
  DecisionReason,
  DeferredToolUse,
  HumanDecisionResult,
  UsageTotals,
  UsageData
} from './types';
