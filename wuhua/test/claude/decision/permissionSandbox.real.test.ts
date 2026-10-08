import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { permissionSandbox } from '../../../src/claude';

const CAPTURE_DIR = join(process.cwd(), '.solo', 'capture');

describe('permissionSandbox 策略', () => {
  describe('真实捕获匹配', () => {
    it('decisionPermissionSandbox-0（命令审批：Yes / Yes-dont-ask-again / No）→ 命中', () => {
      const content = readFileSync(join(CAPTURE_DIR, 'decisionPermissionSandbox-0.md'), 'utf-8');
      expect(permissionSandbox({ content })).toBe('permissionSandbox');
    });

    it('decisionPermissionSandbox-1（文件删除审批：Yes / Yes-always-allow / No）→ 命中', () => {
      const content = readFileSync(join(CAPTURE_DIR, 'decisionPermissionSandbox-1.md'), 'utf-8');
      expect(permissionSandbox({ content })).toBe('permissionSandbox');
    });
  });

  describe('负向匹配：不满足规则时不触发', () => {
    it('无编号选项 → null', () => {
      expect(permissionSandbox({ content: '普通文本内容' })).toBeNull();
    });

    it('编号选项但无 Yes/No → null', () => {
      const content = ['1. 方案 A', '2. 方案 B', '3. 方案 C', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox({ content })).toBeNull();
    });

    it('编号选项有 Yes 但无 No → null', () => {
      const content = ['1. Yes', '2. Maybe', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox({ content })).toBeNull();
    });

    it('编号选项有 No 但无 Yes → null', () => {
      const content = ['1. No', '2. Maybe', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox({ content })).toBeNull();
    });

    it('有 Yes/No 和编号但缺少 "Esc to cancel" → null', () => {
      const content = ['1. Yes', '2. No'].join('\n');
      expect(permissionSandbox({ content })).toBeNull();
    });

    it('有 Yes/No 和编号但缺少 "Tab to amend" → null', () => {
      const content = ['1. Yes', '2. No', 'Esc to cancel'].join('\n');
      expect(permissionSandbox({ content })).toBeNull();
    });

    it('编号不从 1 开始 → null', () => {
      const content = ['2. Yes', '3. No', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox({ content })).toBeNull();
    });

    it('编号不连续 → null', () => {
      const content = ['1. Yes', '3. No', 'Esc to cancel · Tab to amend'].join('\n');
      expect(permissionSandbox({ content })).toBeNull();
    });

    it('空内容 → null', () => {
      expect(permissionSandbox({ content: '' })).toBeNull();
    });
  });
});
