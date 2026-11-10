import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelpCommand } from '@/cli/commander/help';

describe('HelpCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置单例实例以便测试
    (HelpCommand as unknown as { instance: HelpCommand | undefined }).instance = undefined;
  });

  it('应该存在 HelpCommand 类', () => {
    expect(HelpCommand).toBeDefined();
  });

  it('应该提供静态 of 方法获取单例实例', () => {
    const instance = HelpCommand.of();
    expect(instance).toBeDefined();
    expect(instance instanceof HelpCommand).toBe(true);
  });

  it('应该返回相同的单例实例', () => {
    const instance1 = HelpCommand.of();
    const instance2 = HelpCommand.of();
    expect(instance1).toBe(instance2);
  });

  it('execute 方法应该输出用法说明', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const instance = HelpCommand.of();

    instance.execute();

    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map(call => (call as string[]).join(' '));
    expect(calls).toContainEqual(expect.stringContaining('用法:'));
    expect(calls).toContainEqual(expect.stringContaining('silkbook [命令]'));

    consoleSpy.mockRestore();
  });

  it('execute 方法应该输出可用命令列表', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const instance = HelpCommand.of();

    instance.execute();

    const calls = consoleSpy.mock.calls.map(call => (call as string[]).join(' '));
    expect(calls).toContainEqual(expect.stringContaining('可用命令:'));
    expect(calls).toContainEqual(expect.stringContaining('version    查看版本号'));
    expect(calls).toContainEqual(expect.stringContaining('help       显示帮助信息'));

    consoleSpy.mockRestore();
  });

  it('execute 方法应该输出可用参数列表', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const instance = HelpCommand.of();

    instance.execute();

    const calls = consoleSpy.mock.calls.map(call => (call as string[]).join(' '));
    expect(calls).toContainEqual(expect.stringContaining('可用参数:'));
    expect(calls).toContainEqual(expect.stringContaining('-v, --version  输出版本号'));
    expect(calls).toContainEqual(expect.stringContaining('-h, --help     输出帮助信息'));

    consoleSpy.mockRestore();
  });

  it('execute 方法应该输出正确的格式', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const instance = HelpCommand.of();

    instance.execute();

    const calls = consoleSpy.mock.calls;
    // 验证输出行数
    expect(calls.length).toBeGreaterThanOrEqual(6);

    consoleSpy.mockRestore();
  });
});
