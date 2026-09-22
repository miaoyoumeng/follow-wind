import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { detectIntervention } from '../../../src/claude';
import { logger } from '../../../src/logging';

describe('detectIntervention 责任链编排器', () => {
  let testLogDir: string;
  let testLogFile: string;

  beforeEach(() => {
    testLogDir = join(tmpdir(), `solo-decision-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testLogDir, { recursive: true });
    testLogFile = join(testLogDir, 'test.log');
    logger.configure({ level: 'debug', file: testLogFile });
  });

  afterEach(() => {
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('命中策略时返回策略名称', () => {
    it('命中结构化提问 → 返回 "structuredQuestion"', () => {
      const content = ['1. 选项 A', '2. Type something.', '3. Chat about this'].join('\n');
      const result = detectIntervention({ content });
      expect(result).toBe('structuredQuestion');
    });

    it('命中权限沙盒（权限确认 UI）→ 返回 "permissionSandbox"', () => {
      const content = ['Do you want to proceed?', '1. Yes', '2. No', 'Esc to cancel · Tab to amend'].join('\n');
      const result = detectIntervention({ content });
      expect(result).toBe('permissionSandbox');
    });
  });

  describe('无信号时返回 null 并记录 debug 日志', () => {
    it('正常陈述 → 返回 null', () => {
      const result = detectIntervention({ content: '所有测试通过，代码已提交。' });
      expect(result).toBeNull();
    });

    it('普通编号列表（无 Yes/No）→ 返回 null', () => {
      const content = ['1. 方案 A', '2. 方案 B', '3. 方案 C'].join('\n');
      const result = detectIntervention({ content });
      expect(result).toBeNull();
    });
  });

  describe('优先级：高优先级策略先匹配', () => {
    it('同时命中多个策略时返回优先级最高的', () => {
      // 结构化提问模式命中 structuredQuestion，同时也包含"矛盾"可能触发 conflictExposure
      // structuredQuestion 优先级最高
      const content = ['1. 方案 A（有矛盾）', '2. Type something.', '3. Chat about this'].join('\n');
      const result = detectIntervention({ content });
      expect(result).toBe('structuredQuestion');
    });
  });
});
