import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockReadPidFile, mockIsProcessAlive, mockStatTask } = vi.hoisted(() => ({
  mockReadPidFile: vi.fn(),
  mockIsProcessAlive: vi.fn(),
  mockStatTask: vi.fn()
}));

vi.mock('../../src/envs', () => ({
  checkSettings: vi.fn().mockReturnValue({ exists: true, path: '/.solo/config' })
}));

vi.mock('../../src/config', () => ({
  readConfig: vi.fn().mockReturnValue({ name: 'test-project' })
}));

vi.mock('../../src/agents', () => ({
  checkAgentWorkspaces: vi.fn()
}));

vi.mock('../../src/process', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    readPidFile: mockReadPidFile,
    isProcessAlive: mockIsProcessAlive
  };
});

vi.mock('../../src/ipc', () => ({
  statTask: mockStatTask
}));

import { runStatus } from '../../src/commander/status';
import { checkAgentWorkspaces } from '../../src/agents';

/** 去除 ANSI 转义码，便于纯文本断言 */
const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

describe('runStatus', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // === 基础显示 ===

  it('显示 name 和 pid', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);
    mockReadPidFile.mockReturnValue(12345);
    mockIsProcessAlive.mockReturnValue(true);

    await runStatus();

    const output = consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n');
    const clean = stripAnsi(output);
    expect(clean).toContain('name:');
    expect(clean).toContain('test-project');
    expect(clean).toContain('pid:');
    expect(clean).toContain('12345');
  });

  // === 进程存活 → pid + tasks ===

  it('daemon 存活时显示 pid 和 tasks 各状态计数', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);
    mockReadPidFile.mockReturnValue(12345);
    mockIsProcessAlive.mockReturnValue(true);
    mockStatTask.mockResolvedValue({ pending: 1, running: 2, completed: 3, timeout: 0, failed: 0, killed: 0 });

    await runStatus();

    const output = stripAnsi(consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n'));
    expect(output).toContain('12345');
    expect(output).not.toContain('❓❓❓');
    expect(output).toContain('tasks:');
    expect(output).toContain('pending:');
    expect(output).toContain('running:');
    expect(output).toContain('completed:');
    expect(output).toContain('timeout:');
    expect(output).toContain('failed:');
    expect(output).toContain('killed:');
    expect(output).toMatch(/pending:.*1/);
    expect(output).toMatch(/running:.*2/);
    expect(output).toMatch(/completed:.*3/);
  });

  it('daemon 存活且无任务时显示全零', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);
    mockReadPidFile.mockReturnValue(99);
    mockIsProcessAlive.mockReturnValue(true);
    mockStatTask.mockResolvedValue({ pending: 0, running: 0, completed: 0, timeout: 0, failed: 0, killed: 0 });

    await runStatus();

    const output = stripAnsi(consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n'));
    expect(output).toContain('pending:');
    expect(output).toMatch(/pending:.*0/);
  });

  // === 进程不存活 → ❓❓❓ + 隐藏 tasks ===

  it('PID 文件不存在时 pid 显示 ❓❓❓ 且不显示 tasks', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);
    mockReadPidFile.mockReturnValue(null);

    await runStatus();

    const output = stripAnsi(consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n'));
    expect(output).toContain('❓❓❓');
    expect(output).not.toContain('tasks:');
    expect(mockStatTask).not.toHaveBeenCalled();
  });

  it('PID 文件存在但进程不存活时 pid 显示 ❓❓❓ 且不显示 tasks', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);
    mockReadPidFile.mockReturnValue(12345);
    mockIsProcessAlive.mockReturnValue(false);

    await runStatus();

    const output = stripAnsi(consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n'));
    expect(output).toContain('❓❓❓');
    expect(output).not.toContain('tasks:');
  });

  // === agents 表格 ===

  it('agents 表格包含表头和所有 agent 行', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'frontend', workspace: '/path/fe', exists: true, settingsCreated: false },
      { name: 'backend', workspace: '/path/be', exists: true, settingsCreated: false }
    ]);
    mockReadPidFile.mockReturnValue(null);

    await runStatus();

    const output = stripAnsi(consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n'));
    expect(output).toContain('agents:');
    expect(output).toContain('name');
    expect(output).toContain('workspaces');
    expect(output).toContain('status');
    expect(output).toContain('frontend');
    expect(output).toContain('/path/fe');
    expect(output).toContain('backend');
    expect(output).toContain('/path/be');
    expect(output).toContain('✅');
  });

  it('agents 表格列对齐（各行 │ 显示宽度位置一致）', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'frontend', workspace: '/fe', exists: true, settingsCreated: false },
      { name: 'api', workspace: '/long/path/api', exists: true, settingsCreated: false }
    ]);
    mockReadPidFile.mockReturnValue(null);

    await runStatus();

    const lines = consoleSpy.mock.calls
      .map((c: string[]) => stripAnsi(String(c[0])))
      .filter((l: string) => l.includes('│'));
    expect(lines.length).toBeGreaterThan(0);
    const displayWidthOf = (s: string): number => {
      let w = 0;
      for (const ch of s) {
        const code = ch.codePointAt(0) ?? 0;
        w +=
          code >= 0x1100 ||
          (code >= 0x3000 && code <= 0x9fff) ||
          (code >= 0xac00 && code <= 0xd7af) ||
          (code >= 0xf900 && code <= 0xfaff) ||
          (code >= 0xfe30 && code <= 0xfe4f) ||
          (code >= 0xff01 && code <= 0xff60) ||
          (code >= 0xffe0 && code <= 0xffe6) ||
          (code >= 0x1f000 && code <= 0x1fbff) ||
          (code >= 0x20000 && code <= 0x2fffd) ||
          (code >= 0x30000 && code <= 0x3fffd)
            ? 2
            : 1;
      }
      return w;
    };
    const pipePositions = lines.map((l: string) => {
      const positions: number[] = [];
      let dw = 0;
      for (const ch of l) {
        if (ch === '│') positions.push(dw);
        dw += displayWidthOf(ch);
      }
      return positions;
    });
    for (let i = 1; i < pipePositions.length; i++) {
      expect(pipePositions[i]).toEqual(pipePositions[0]);
    }
  });

  it('含 ✅ 宽字符的表格按显示宽度对齐（终端列不偏移）', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'fe', workspace: '/fe', exists: true, settingsCreated: false }
    ]);
    mockReadPidFile.mockReturnValue(null);

    await runStatus();

    const lines = consoleSpy.mock.calls
      .map((c: string[]) => stripAnsi(String(c[0])))
      .filter((l: string) => l.includes('│'));
    expect(lines.length).toBeGreaterThan(0);
    // 计算每行 │ 的显示宽度位置（✅ 等宽字符占 2 列）
    const displayWidthOf = (s: string): number => {
      let w = 0;
      for (const ch of s) {
        const code = ch.codePointAt(0) ?? 0;
        if (
          code >= 0x1100 ||
          (code >= 0x3000 && code <= 0x9fff) ||
          (code >= 0xac00 && code <= 0xd7af) ||
          (code >= 0xf900 && code <= 0xfaff) ||
          (code >= 0xfe30 && code <= 0xfe4f) ||
          (code >= 0xff01 && code <= 0xff60) ||
          (code >= 0xffe0 && code <= 0xffe6) ||
          (code >= 0x1f000 && code <= 0x1fbff) ||
          (code >= 0x20000 && code <= 0x2fffd) ||
          (code >= 0x30000 && code <= 0x3fffd)
        ) {
          w += 2;
        } else {
          w += 1;
        }
      }
      return w;
    };
    const pipePositions = lines.map((l: string) => {
      const positions: number[] = [];
      let dw = 0;
      for (const ch of l) {
        if (ch === '│') positions.push(dw);
        const code = ch.codePointAt(0) ?? 0;
        dw +=
          code >= 0x1100 ||
          (code >= 0x3000 && code <= 0x9fff) ||
          (code >= 0xac00 && code <= 0xd7af) ||
          (code >= 0xf900 && code <= 0xfaff) ||
          (code >= 0xfe30 && code <= 0xfe4f) ||
          (code >= 0xff01 && code <= 0xff60) ||
          (code >= 0xffe0 && code <= 0xffe6) ||
          (code >= 0x1f000 && code <= 0x1fbff) ||
          (code >= 0x20000 && code <= 0x2fffd) ||
          (code >= 0x30000 && code <= 0x3fffd)
            ? 2
            : 1;
      }
      return positions;
    });
    for (let i = 1; i < pipePositions.length; i++) {
      expect(pipePositions[i]).toEqual(pipePositions[0]);
    }
  });

  it('workspace 不存在的 agent 显示 ❌', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'broken', workspace: '/missing', exists: false, settingsCreated: false }
    ]);
    mockReadPidFile.mockReturnValue(null);

    await runStatus();

    const output = stripAnsi(consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n'));
    expect(output).toContain('broken');
    expect(output).toContain('❌');
  });

  it('agents 表格列顺序为 name → status → workspaces', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([
      { name: 'frontend', workspace: '/path/fe', exists: true, settingsCreated: false }
    ]);
    mockReadPidFile.mockReturnValue(null);

    await runStatus();

    const headerLine = consoleSpy.mock.calls
      .map((c: string[]) => stripAnsi(String(c[0])))
      .find((l: string) => l.includes('name') && l.includes('status') && l.includes('workspaces'));
    expect(headerLine).toBeDefined();
    const namePos = headerLine!.indexOf('name');
    const statusPos = headerLine!.indexOf('status');
    const workspacePos = headerLine!.indexOf('workspaces');
    expect(namePos).toBeLessThan(statusPos);
    expect(statusPos).toBeLessThan(workspacePos);
  });

  // === tasks 格式 ===

  it('tasks 标签右对齐且有缩进（所有冒号在同一列）', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);
    mockReadPidFile.mockReturnValue(1);
    mockIsProcessAlive.mockReturnValue(true);
    mockStatTask.mockResolvedValue({ pending: 0, running: 0, completed: 0, timeout: 0, failed: 0, killed: 0 });

    await runStatus();

    const lines = consoleSpy.mock.calls
      .map((c: string[]) => stripAnsi(String(c[0])))
      .filter((l: string) => /pending|running|completed|timeout|failed|killed/.test(l));
    expect(lines).toHaveLength(6);
    // 每行有前导空格（缩进）
    for (const line of lines) {
      expect(line).toMatch(/^\s+\S+:/);
    }
    // 所有冒号在同一列位置
    const colonPos = lines.map((l: string) => l.indexOf(':'));
    for (const pos of colonPos) {
      expect(pos).toBe(colonPos[0]);
    }
  });

  it('无 agent 时只显示表头', async () => {
    vi.mocked(checkAgentWorkspaces).mockReturnValue([]);
    mockReadPidFile.mockReturnValue(null);

    await runStatus();

    const output = stripAnsi(consoleSpy.mock.calls.map((c: string[]) => c[0]).join('\n'));
    expect(output).toContain('agents:');
    expect(output).toContain('name');
    expect(output).toContain('workspaces');
    expect(output).toContain('status');
  });
});
