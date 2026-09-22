import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { structuredQuestion } from '../../../src/claude/decision/structuredQuestion';

const CAPTURE_DIR = join(process.cwd(), '.solo', 'capture');

describe('structuredQuestion 策略', () => {
  describe('新规则：有序连续编号 + 末尾固定提示', () => {
    it('decisionStructuredQuestion-0 → 命中（编号 1-5 连续，末尾 Type something + Chat about this）', () => {
      const content = readFileSync(join(CAPTURE_DIR, 'decisionStructuredQuestion-0.md'), 'utf-8');
      const result = structuredQuestion({ content });
      expect(result).toBe('structuredQuestion');
    });

    it('decisionStructuredQuestion-1 → 命中（编号 1-4,6 连续，末尾 Chat about this）', () => {
      const content = readFileSync(join(CAPTURE_DIR, 'decisionStructuredQuestion-1.md'), 'utf-8');
      const result = structuredQuestion({ content });
      expect(result).toBe('structuredQuestion');
    });

    it('编号不连续（如 1,3,5）→ 不命中', () => {
      const content = ['1. 选项 A', '3. 选项 B', '5. Type something.', '6. Chat about this'].join('\n');
      const result = structuredQuestion({ content });
      expect(result).toBeNull();
    });

    it('编号不从 1 开始（如 2,3,4）→ 不命中', () => {
      const content = ['2. 选项 A', '3. 选项 B', '4. Type something.', '5. Chat about this'].join('\n');
      const result = structuredQuestion({ content });
      expect(result).toBeNull();
    });

    it('缺少 "Type something" → 不命中', () => {
      const content = ['1. 选项 A', '2. 选项 B', '3. 选项 C', '4. Chat about this'].join('\n');
      const result = structuredQuestion({ content });
      expect(result).toBeNull();
    });

    it('缺少 "Chat about this" → 不命中', () => {
      const content = ['1. 选项 A', '2. 选项 B', '3. Type something.'].join('\n');
      const result = structuredQuestion({ content });
      expect(result).toBeNull();
    });

    it('末尾两项不是 "Type something" 和 "Chat about this" → 不命中', () => {
      const content = ['1. 选项 A', '2. 选项 B', '3. 自定义输入', '4. 继续讨论'].join('\n');
      const result = structuredQuestion({ content });
      expect(result).toBeNull();
    });
  });
});
