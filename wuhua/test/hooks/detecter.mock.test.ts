import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStructuredQuestion, mockPermissionSandbox, mockConflictExposure } = vi.hoisted(() => ({
  mockStructuredQuestion: vi.fn(),
  mockPermissionSandbox: vi.fn(),
  mockConflictExposure: vi.fn()
}));

vi.mock('../../src/claude/decision/structuredQuestion', () => ({
  structuredQuestion: mockStructuredQuestion
}));

vi.mock('../../src/claude/decision/permissionSandbox', () => ({
  permissionSandbox: mockPermissionSandbox
}));

vi.mock('../../src/claude/decision/conflictExposure', () => ({
  conflictExposure: mockConflictExposure
}));

import { detectIntervention } from '../../src/hooks/detecter';

describe('detectIntervention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('所有策略返回 null 时返回 null', () => {
    mockStructuredQuestion.mockReturnValue(null);
    mockPermissionSandbox.mockReturnValue(null);
    mockConflictExposure.mockReturnValue(null);

    const result = detectIntervention({ content: '普通文本' });

    expect(result).toBeNull();
  });

  it('返回第一个匹配的策略名称（structuredQuestion）', () => {
    mockStructuredQuestion.mockReturnValue('structuredQuestion');

    const result = detectIntervention({ content: '1. 选项A\n2. 选项B' });

    expect(result).toBe('structuredQuestion');
    expect(mockPermissionSandbox).not.toHaveBeenCalled();
    expect(mockConflictExposure).not.toHaveBeenCalled();
  });

  it('第一个策略不匹配时继续检查第二个（permissionSandbox）', () => {
    mockStructuredQuestion.mockReturnValue(null);
    mockPermissionSandbox.mockReturnValue('permissionSandbox');

    const result = detectIntervention({ content: '是否允许？' });

    expect(result).toBe('permissionSandbox');
    expect(mockConflictExposure).not.toHaveBeenCalled();
  });

  it('前两个策略不匹配时检查第三个（conflictExposure）', () => {
    mockStructuredQuestion.mockReturnValue(null);
    mockPermissionSandbox.mockReturnValue(null);
    mockConflictExposure.mockReturnValue('conflictExposure');

    const result = detectIntervention({ content: '有冲突' });

    expect(result).toBe('conflictExposure');
  });

  it('将 context 原样传递给每个策略', () => {
    const context = { content: '测试内容', cwd: '/tmp' };
    mockStructuredQuestion.mockReturnValue(null);
    mockPermissionSandbox.mockReturnValue(null);
    mockConflictExposure.mockReturnValue(null);

    detectIntervention(context);

    expect(mockStructuredQuestion).toHaveBeenCalledWith(context);
    expect(mockPermissionSandbox).toHaveBeenCalledWith(context);
    expect(mockConflictExposure).toHaveBeenCalledWith(context);
  });
});
