import { describe, it, expect } from 'vitest';
import { structuredQuestion } from '../../../src/claude';
import type { DecisionContext } from '../../../src/claude';

describe('structuredQuestion（新规则）', () => {
  const makeContext = (content: string): DecisionContext => ({ content });

  describe('正向匹配：有序连续编号 + 末尾固定提示', () => {
    it('最简：1, 2 连续，末尾 Type something + Chat about this', () => {
      const content = ['1. 选项 A', '2. Type something.', '3. Chat about this'].join('\n');
      expect(structuredQuestion(makeContext(content))).toBe('structuredQuestion');
    });

    it('多选项：1-5 连续，末尾 Type something + Chat about this', () => {
      const content = [
        '1. 方案一',
        '   详细说明',
        '2. 方案二',
        '   详细说明',
        '3. 方案三',
        '4. Type something.',
        '5. Chat about this'
      ].join('\n');
      expect(structuredQuestion(makeContext(content))).toBe('structuredQuestion');
    });

    it('选项带 ❯ 前缀（Claude 选中项）仍匹配', () => {
      const content = ['❯ 1. 选项 A', '  2. 选项 B', '  3. Type something.', '  4. Chat about this'].join('\n');
      expect(structuredQuestion(makeContext(content))).toBe('structuredQuestion');
    });

    it('选项带 ↓ 前缀（滚动可见项）仍匹配', () => {
      const content = ['❯ 1. 选项 A', '  2. 选项 B', '  ↓ 3. Type something.', '  4. Chat about this'].join('\n');
      expect(structuredQuestion(makeContext(content))).toBe('structuredQuestion');
    });

    it('capture-0 格式（❯ 前缀 + 缩进 + Type something + Chat about this）', () => {
      const content = [
        '☐ 删除范围',
        '',
        '「删除 registry.ts 功能入口」的范围是什么？',
        '',
        '❯ 1. 仅删除 barrel 导出',
        '     保留文件',
        '  2. 彻底删除 registry.ts',
        '     删除文件 + 测试',
        '  3. 替换为内联注册',
        '     直接 for 循环',
        '  4. Type something.',
        '────────────',
        '  5. Chat about this',
        '',
        'Enter to select · ↑/↓ to navigate · Esc to cancel'
      ].join('\n');
      expect(structuredQuestion(makeContext(content))).toBe('structuredQuestion');
    });

    it('capture-1 格式（❯ + ↓ 前缀 + 编号跳跃但末尾有 Chat about this）', () => {
      const content = [
        '☐ ESLint',
        '',
        '如何处理这些预存在的 ESLint 错误？',
        '',
        '❯ 1. 全部修复',
        '按文件逐个修复',
        '2. 仅修我涉及的文件',
        '   只确保相关文件无错',
        '3. 临时跳过 lint',
        '   先跳过 ESLint',
        '   ↓ 4. 分优先级修',
        '   先修 error 级别',
        '   ─────────────',
        '6. Chat about this',
        '',
        'Enter to select · ↑/↓ to navigate · Esc to cancel'
      ].join('\n');
      expect(structuredQuestion(makeContext(content))).toBe('structuredQuestion');
    });
  });

  describe('负向匹配：不满足规则时不触发', () => {
    it('编号不连续（1, 3, 5）→ null', () => {
      const content = ['1. 选项 A', '3. 选项 B', '5. Chat about this'].join('\n');
      expect(structuredQuestion(makeContext(content))).toBeNull();
    });

    it('编号不从 1 开始（2, 3, 4）→ null', () => {
      const content = ['2. 选项 A', '3. 选项 B', '4. Chat about this'].join('\n');
      expect(structuredQuestion(makeContext(content))).toBeNull();
    });

    it('只有一个编号 → null', () => {
      const content = ['1. 唯一选项'].join('\n');
      expect(structuredQuestion(makeContext(content))).toBeNull();
    });

    it('末尾缺少 Chat about this → null', () => {
      const content = ['1. 选项 A', '2. 选项 B', '3. 选项 C'].join('\n');
      expect(structuredQuestion(makeContext(content))).toBeNull();
    });

    it('纯文本无编号 → null', () => {
      const content = '这是一段普通文本，没有任何编号选项。';
      expect(structuredQuestion(makeContext(content))).toBeNull();
    });

    it('空内容 → null', () => {
      expect(structuredQuestion(makeContext(''))).toBeNull();
    });
  });
});
