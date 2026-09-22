import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

import { registerCommands } from '../../src/bin/solo';
import type { CommandSpec } from '../../src/commander/types';

/**
 * 构造测试用 program：拦截 process.exit 并把输出丢弃，
 * 使参数错误（如缺失 required option）以抛异常方式暴露，且不污染测试输出
 */
const createProgram = (): Command => {
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeOut: () => {}, writeErr: () => {} });
  return program;
};

describe('registerCommands', () => {
  it('注册命令名与描述', () => {
    const program = createProgram();
    const specs: CommandSpec[] = [{ name: 'ping', description: '连通性检查', execute: () => {} }];

    registerCommands(program, specs);

    const registered = program.commands.find(c => c.name() === 'ping');
    expect(registered).toBeDefined();
    expect(registered?.description()).toBe('连通性检查');
  });

  it('一次注册多个 spec 时全部生效且保持顺序', () => {
    const program = createProgram();
    const specs: CommandSpec[] = [
      { name: 'alpha', description: 'a', execute: () => {} },
      { name: 'beta', description: 'b', execute: () => {} },
      { name: 'gamma', description: 'c', execute: () => {} }
    ];

    registerCommands(program, specs);

    expect(program.commands.map(c => c.name())).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('parse 后调用 execute，并按声明顺序传入位置参数', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [
      {
        name: 'send',
        description: '发送消息',
        args: [
          { syntax: '<target>', description: '目标' },
          { syntax: '<body>', description: '内容' }
        ],
        execute
      }
    ]);

    await program.parseAsync(['node', 'solo', 'send', 'alice', 'hello world']);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0].slice(0, 2)).toEqual(['alice', 'hello world']);
  });

  it('带 parser 的参数：execute 收到 parser 处理后的值而非字符串', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [
      {
        name: 'capture',
        description: '捕获面板',
        args: [
          { syntax: '<agent-name>', description: 'agent 名称' },
          { syntax: '<pane-index>', description: 'pane 索引', parser: parseInt }
        ],
        execute
      }
    ]);

    await program.parseAsync(['node', 'solo', 'capture', 'myagent', '3']);

    expect(execute.mock.calls[0][0]).toBe('myagent');
    expect(execute.mock.calls[0][1]).toBe(3);
  });

  it('可选参数未提供时，execute 收到 undefined', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [
      {
        name: 'usage',
        description: '用量统计',
        args: [
          { syntax: '<agent-name>', description: 'agent 名称' },
          { syntax: '[date]', description: '统计日期' }
        ],
        execute
      }
    ]);

    await program.parseAsync(['node', 'solo', 'usage', 'myagent']);

    expect(execute.mock.calls[0][0]).toBe('myagent');
    expect(execute.mock.calls[0][1]).toBeUndefined();
  });

  it('只有 options 没有 args 的命令：execute 首个参数是选项对象', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [
      {
        name: 'hook',
        description: 'hook 回调入口',
        options: [
          { flags: '--name <name>', description: '事件名', isRequired: true },
          { flags: '--session_name <session_name>', description: 'session 名称', isRequired: true }
        ],
        execute
      }
    ]);

    await program.parseAsync(['node', 'solo', 'hook', '--name', 'alert-bell', '--session_name', 'sess-1']);

    expect(execute.mock.calls[0][0]).toMatchObject({ name: 'alert-bell', session_name: 'sess-1' });
  });

  it('isRequired 为 true 的选项缺失时，parse 报错且不调用 execute', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [
      {
        name: 'hook',
        description: 'hook 回调入口',
        options: [{ flags: '--name <name>', description: '事件名', isRequired: true }],
        execute
      }
    ]);

    await expect(program.parseAsync(['node', 'solo', 'hook'])).rejects.toThrow(/required option/);
    expect(execute).not.toHaveBeenCalled();
  });

  it('allowExcessArguments 为 false 时，多余参数报错且不调用 execute', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [{ name: 'boot', description: '启动', allowExcessArguments: false, execute }]);

    await expect(program.parseAsync(['node', 'solo', 'boot', 'extra'])).rejects.toThrow(/too many arguments/);
    expect(execute).not.toHaveBeenCalled();
  });

  it('未设置 allowExcessArguments 时，多余参数被忽略并正常调用 execute', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [{ name: 'boot', description: '启动', execute }]);

    await program.parseAsync(['node', 'solo', 'boot', 'extra']);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('isRequired 未设置的选项缺失时，仍正常调用 execute', async () => {
    const program = createProgram();
    const execute = vi.fn();
    registerCommands(program, [
      {
        name: 'job',
        description: '后台任务',
        options: [{ flags: '--verbose', description: '详细输出' }],
        execute
      }
    ]);

    await program.parseAsync(['node', 'solo', 'job']);

    expect(execute).toHaveBeenCalledTimes(1);
  });
});
