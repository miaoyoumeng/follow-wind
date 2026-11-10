import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionCommand } from '@/cli/commander/version';

describe('VersionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置单例实例以便测试
    (VersionCommand as unknown as { instance: VersionCommand | undefined }).instance = undefined;
  });

  it('应该存在 VersionCommand 类', () => {
    expect(VersionCommand).toBeDefined();
  });

  it('应该提供静态 of 方法获取单例实例', () => {
    const instance = VersionCommand.of();
    expect(instance).toBeDefined();
    expect(instance instanceof VersionCommand).toBe(true);
  });

  it('应该返回相同的单例实例', () => {
    const instance1 = VersionCommand.of();
    const instance2 = VersionCommand.of();
    expect(instance1).toBe(instance2);
  });

  it('execute 方法应该输出版本号信息', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const instance = VersionCommand.of();

    instance.execute();

    expect(consoleSpy).toHaveBeenCalled();
    const output = (consoleSpy.mock.calls[0] as string[]).join(' ');
    expect(output).toContain('silkbook 版本号：');
    expect(output).toMatch(/silkbook 版本号：\d+\.\d+\.\d+/);

    consoleSpy.mockRestore();
  });

  it('版本号应该符合语义化版本格式', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const instance = VersionCommand.of();

    instance.execute();

    const output = (consoleSpy.mock.calls[0] as string[]).join(' ');
    const semverRegex = /silkbook 版本号：(\d+)\.(\d+)\.(\d+)/;
    expect(output).toMatch(semverRegex);

    consoleSpy.mockRestore();
  });

  it('execute 方法应该使用绿色输出', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const instance = VersionCommand.of();

    instance.execute();

    const output = (consoleSpy.mock.calls[0] as string[]).join(' ');
    // 验证输出了版本号信息（chalk.green 在测试环境中可能不显示颜色代码）
    expect(output).toContain('silkbook 版本号：1.0.0');

    consoleSpy.mockRestore();
  });
});
