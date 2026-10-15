import { describe, it, expect } from 'vitest';
import { conflictExposure } from '../../../src/claude';
import type { DecisionContext } from '../../../src/claude/types';

describe('conflictExposure', () => {
  const makeContext = (content: string): DecisionContext => ({ content });

  describe('正向匹配：冲突关键词 + 序号 + 确认关键词', () => {
    it('中文冲突关键词 + 序号 + 确认', () => {
      const content = [
        '存在两种方案冲突：',
        '1. 方案 A：使用缓存',
        '2. 方案 B：直连数据库',
        '请确认选择哪个方案。'
      ].join('\n');
      expect(conflictExposure(makeContext(content))).toBe('conflictExposure');
    });

    it('英文 conflict 关键词 + 序号 + 确认', () => {
      const content = [
        'There is a conflict between the options:',
        '1. Option A: use cache',
        '2. Option B: direct DB',
        '请确认你希望采用哪种方案。'
      ].join('\n');
      expect(conflictExposure(makeContext(content))).toBe('conflictExposure');
    });

    it('不一致关键词 + 序号 + 确认', () => {
      const content = ['两处逻辑不一致：', '1. 文件 A 使用 UTF-8', '2. 文件 B 使用 GBK', '请确认统一为哪种编码。'].join(
        '\n'
      );
      expect(conflictExposure(makeContext(content))).toBe('conflictExposure');
    });

    it('序号带 ❯ 前缀仍可匹配', () => {
      const content = ['方案冲突如下：', '❯ 1. 保留旧接口', '  2. 废弃旧接口', '请确认。'].join('\n');
      expect(conflictExposure(makeContext(content))).toBe('conflictExposure');
    });
  });

  describe('负向匹配：三条件不全满足时返回 null', () => {
    it('有冲突关键词 + 序号，无确认关键词 → null', () => {
      const content = ['存在方案冲突：', '1. 方案 A', '2. 方案 B'].join('\n');
      expect(conflictExposure(makeContext(content))).toBeNull();
    });

    it('有冲突关键词 + 确认关键词，无序号 → null', () => {
      const content = '存在方案冲突，请确认如何处理。';
      expect(conflictExposure(makeContext(content))).toBeNull();
    });

    it('有序号 + 确认关键词，无冲突关键词 → null', () => {
      const content = ['以下是可选方案：', '1. 方案 A', '2. 方案 B', '请确认。'].join('\n');
      expect(conflictExposure(makeContext(content))).toBeNull();
    });

    it('空内容 → null', () => {
      expect(conflictExposure(makeContext(''))).toBeNull();
    });

    it('只有序号 → null', () => {
      const content = '1. 第一项\n2. 第二项';
      expect(conflictExposure(makeContext(content))).toBeNull();
    });
  });

  describe('真实 capture 数据匹配', () => {
    it('decisionConflictExposure-0：命名冲突 + 编号选项 + 请确认', () => {
      const content = [
        "I should also clarify the naming conflict with the user since there's already an existing",
        'Task interface being exported, and I need to understand whether they want me to rename one of',
        'them or handle this differently.',
        '',
        '⏺ 在动手之前，有两个问题需要澄清：',
        '',
        '  1. 命名冲突',
        '  src/task/types.ts 已有 interface Task（当前表示任务记录，含 id/status/pid',
        '  等字段），src/task/index.ts 也在 export type { Task, ... }。你要求新增的 type Task 会冲突。',
        '',
        '  两种处理方式：',
        '  - A. 重命名现有 Task → TaskRecord，新的 type Task 作为任务策略/定义',
        '  - B. 新类型换个名字（如 TaskHandler、TaskDefinition）',
        '',
        '  2. TaskState 定义',
        '  我倾向定义为任务生命周期状态的子集，用于 kill 时的目标状态：',
        '',
        "  export type TaskState = 'running' | 'killed' | 'failed';",
        '',
        '  理由：kill 操作的语义是终止，目标状态只可能是这三者。pending/completed/timeout 对 kill',
        '  无意义。',
        '',
        '  请确认：',
        '  1. 命名冲突选 A 还是 B？',
        '  2. TaskState 用上面的定义是否合适？'
      ].join('\n');
      expect(conflictExposure(makeContext(content))).toBe('conflictExposure');
    });

    it('decisionConflictExposure-1：TmuxHook 命名冲突 + 编号选项 + 确认', () => {
      const content = [
        '⏺ 看完代码，有 2 个需要确认的点：',
        '',
        '  1. 命名冲突：TmuxHook 在 src/tmux/hooks.ts:83 已定义为 tmux hook 名（字符串联合类型）。现在',
        '  src/hooks/types.ts:13 又定义了 TmuxHook（接口，有 run() 方法）。两者同名但含义完全不同。在',
        '  src/cli/hook.ts 中 import 会冲突。',
        '',
        '  建议：将 src/hooks/types.ts 中的 TmuxHook → WuhuaTmuxHook，ClaudeHook → WuhuaClaudeHook，加',
        '  Wuhua 前缀区分。',
        '',
        '  2. run() 的行为：',
        '  - TmuxHook.run() → 我计划把现有 runHook 中 endpoint=tmux 的逻辑（校验 → 匹配 session →',
        '    capturePane → detectIntervention）搬过去',
        '  - ClaudeHook.run() → 现有代码标注 // endpoint=claude 暂不实现，run() 是否也只记日志？',
        '',
        '  ---',
        '',
        '  在你确认前我先不动代码。你确认下：',
        '  1. 是否加 Wuhua 前缀避免命名冲突？还是其他命名方案？',
        '  2. ClaudeHook.run() 目前是 stub（只记日志）是否正确？'
      ].join('\n');
      expect(conflictExposure(makeContext(content))).toBe('conflictExposure');
    });
  });
});
