// solo agent <args...> 的参数分发解析（不含命令名）
import type { AgentArgs } from './types';

export type { AgentArgs } from './types';

/**
 * 解析 agent 命令参数
 * 支持形式：add <name> <path> | <name> workspace | <name> panes
 */
export const parseAgentArgs = (tokens: string[]): AgentArgs => {
  if (tokens.length === 0) {
    return { kind: 'help' };
  }

  const [first, second, third] = tokens;

  // add 子命令：add <name> <path>
  if (first === 'add') {
    if (!second || !third) {
      return { kind: 'error' };
    }
    return { kind: 'add', name: second, path: third };
  }

  // 查询动作：<name> workspace | <name> panes
  if (second === 'workspace') {
    return { kind: 'workspace', name: first };
  }
  if (second === 'panes') {
    return { kind: 'panes', name: first };
  }

  return { kind: 'error' };
};
