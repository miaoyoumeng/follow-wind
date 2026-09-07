import { describe, it, expect } from 'vitest';
import { parseAgentArgs } from '../../../src/commander/agent/parse';

describe('parseAgentArgs', () => {
  it('无参数时返回 help', () => {
    expect(parseAgentArgs([])).toEqual({ kind: 'help' });
  });

  it('add 后缺 name 或 path 返回错误', () => {
    expect(parseAgentArgs(['add'])).toEqual({ kind: 'error' });
    expect(parseAgentArgs(['add', 'admin-pm'])).toEqual({ kind: 'error' });
  });

  it('add 完整参数返回 add 指令', () => {
    expect(parseAgentArgs(['add', 'admin-pm', '/tmp'])).toEqual({
      kind: 'add',
      name: 'admin-pm',
      path: '/tmp'
    });
  });

  it('<name> workspace 返回 workspace 指令', () => {
    expect(parseAgentArgs(['admin-pm', 'workspace'])).toEqual({
      kind: 'workspace',
      name: 'admin-pm'
    });
  });

  it('<name> panes 返回 panes 指令', () => {
    expect(parseAgentArgs(['admin-pm', 'panes'])).toEqual({
      kind: 'panes',
      name: 'admin-pm'
    });
  });

  it('只有一个 name 时返回错误', () => {
    expect(parseAgentArgs(['admin-pm'])).toEqual({ kind: 'error' });
  });

  it('未知动作返回错误', () => {
    expect(parseAgentArgs(['admin-pm', 'bogus'])).toEqual({ kind: 'error' });
  });
});
