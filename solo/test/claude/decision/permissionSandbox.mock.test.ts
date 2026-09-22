import { describe, it, expect } from 'vitest';
import { permissionSandbox } from '../../../src/claude';
import type { DecisionContext } from '../../../src/claude/types';

describe('permissionSandbox（新规则）', () => {
  const makeContext = (content: string): DecisionContext => ({ content });

  describe('正向匹配：编号连续 + Yes/No + 固定提示', () => {
    it('最简权限确认：1.Yes 2.No + 固定提示', () => {
      const content = ['Do you want to proceed?', '1. Yes', '2. No', '', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBe('permissionSandbox');
    });

    it('带中间选项（Yes, Yes-and-dont-ask, No）', () => {
      const content = [
        'This command requires approval',
        '',
        'Do you want to proceed?',
        '❯ 1. Yes',
        "  2. Yes, and don't ask again for: pnpm vitest *",
        '  3. No',
        '',
        'Esc to cancel · Tab to amend · ctrl+e to explain'
      ].join('\n');
      expect(permissionSandbox(makeContext(content))).toBe('permissionSandbox');
    });

    it('带路径授权的权限确认', () => {
      const content = [
        'Bash command',
        '  rm /path/to/file.ts',
        '',
        'Do you want to proceed?',
        '❯ 1. Yes',
        '  2. Yes, and always allow access to /path from this project',
        '  3. No',
        '',
        'Esc to cancel · Tab to amend · ctrl+e to explain'
      ].join('\n');
      expect(permissionSandbox(makeContext(content))).toBe('permissionSandbox');
    });

    it('编号带 ❯ 前缀仍匹配', () => {
      const content = ['❯ 1. Yes', '  2. No', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBe('permissionSandbox');
    });
  });

  describe('负向匹配：不满足规则时不触发', () => {
    it('无编号选项 → null', () => {
      expect(permissionSandbox(makeContext('普通文本'))).toBeNull();
    });

    it('编号选项但无 Yes/No → null', () => {
      const content = ['1. 方案 A', '2. 方案 B', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBeNull();
    });

    it('有 Yes 无 No → null', () => {
      const content = ['1. Yes', '2. Maybe', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBeNull();
    });

    it('有 No 无 Yes → null', () => {
      const content = ['1. No', '2. Maybe', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBeNull();
    });

    it('缺少 "Esc to cancel" → null', () => {
      const content = ['1. Yes', '2. No', 'Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBeNull();
    });

    it('缺少 "Tab to amend" → null', () => {
      const content = ['1. Yes', '2. No', 'Esc to cancel'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBeNull();
    });

    it('编号不从 1 开始 → null', () => {
      const content = ['2. Yes', '3. No', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBeNull();
    });

    it('编号不连续 → null', () => {
      const content = ['1. Yes', '3. No', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox(makeContext(content))).toBeNull();
    });

    it('空内容 → null', () => {
      expect(permissionSandbox(makeContext(''))).toBeNull();
    });
  });
});
