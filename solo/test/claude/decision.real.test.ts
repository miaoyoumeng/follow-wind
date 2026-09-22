import { describe, it, expect } from 'vitest';
import { needsHumanDecision, type ExtendedStopReason, type HumanDecisionResult } from '../../src/claude';

describe('needsHumanDecision', () => {
  describe('tool_deferred：明确被推迟的工具调用', () => {
    it('返回 requiresHuman=true, reason=tool_deferred', () => {
      const deferred = { id: 'tool_1', name: 'Bash', input: { command: 'rm -rf /' } };
      const result = needsHumanDecision('tool_deferred', deferred);
      expect(result.requiresHuman).toBe(true);
      expect(result.reason).toBe('tool_deferred');
      expect(result.deferredTool).toBe(deferred);
      expect(result.message).toContain('Bash');
      expect(result.message).toContain('推迟');
    });

    it('deferredToolUse 未传时 message 使用 unknown 占位', () => {
      const result = needsHumanDecision('tool_deferred');
      expect(result.requiresHuman).toBe(true);
      expect(result.reason).toBe('tool_deferred');
      expect(result.deferredTool).toBeUndefined();
      expect(result.message).toContain('unknown');
    });
  });

  describe('refusal：模型拒绝回答', () => {
    it('返回 requiresHuman=true, reason=refusal', () => {
      const result = needsHumanDecision('refusal');
      expect(result.requiresHuman).toBe(true);
      expect(result.reason).toBe('refusal');
      expect(result.deferredTool).toBeUndefined();
      expect(result.message).toContain('拒绝');
    });
  });

  describe('tool_use + 敏感工具：需要人工批准', () => {
    const sensitive = new Set(['dangerous_tool', 'rm']);
    const deferred = { id: 'tool_2', name: 'dangerous_tool', input: {} };

    it('工具名在敏感集合内，返回 requiresHuman=true, reason=sensitive_tool', () => {
      const result = needsHumanDecision('tool_use', deferred, sensitive);
      expect(result.requiresHuman).toBe(true);
      expect(result.reason).toBe('sensitive_tool');
      expect(result.deferredTool).toBe(deferred);
      expect(result.message).toContain('dangerous_tool');
      expect(result.message).toContain('敏感');
    });

    it('工具名不在敏感集合内，返回 requiresHuman=false', () => {
      const nonSensitive = { id: 'tool_3', name: 'ReadFile', input: {} };
      const result = needsHumanDecision('tool_use', nonSensitive, sensitive);
      expect(result.requiresHuman).toBe(false);
      expect(result.reason).toBeNull();
    });

    it('tool_use 但无 deferredToolUse，返回 requiresHuman=false', () => {
      const result = needsHumanDecision('tool_use', undefined, sensitive);
      expect(result.requiresHuman).toBe(false);
    });

    it('敏感集合为空时，tool_use 不算敏感', () => {
      const result = needsHumanDecision('tool_use', deferred, new Set());
      expect(result.requiresHuman).toBe(false);
    });
  });

  describe('其他 stop_reason：无需人工决策', () => {
    it.each<ExtendedStopReason>([
      'end_turn',
      'max_tokens',
      'stop_sequence',
      'pause_turn',
      'model_context_window_exceeded'
    ])('stop_reason=%s 返回 requiresHuman=false', reason => {
      const result = needsHumanDecision(reason);
      expect(result.requiresHuman).toBe(false);
      expect(result.reason).toBeNull();
      expect(result.message).toContain('无需人工决策');
    });

    it('stop_reason=null 返回 requiresHuman=false', () => {
      const result = needsHumanDecision(null);
      expect(result.requiresHuman).toBe(false);
      expect(result.reason).toBeNull();
    });
  });

  describe('类型完整性', () => {
    it('返回值符合 HumanDecisionResult 结构', () => {
      const result: HumanDecisionResult = needsHumanDecision('refusal');
      expect(result).toHaveProperty('requiresHuman');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('message');
      expect(typeof result.requiresHuman).toBe('boolean');
    });
  });
});
