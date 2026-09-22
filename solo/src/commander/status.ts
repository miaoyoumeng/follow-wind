import chalk from 'chalk';

import { checkSettings } from '../envs';
import { readConfig } from '../config';
import { checkAgentWorkspaces, type WorkspaceCheckResult } from '../agents';
import { readPidFile, isProcessAlive } from '../process';
import { listTasks as ipcListTasks } from '../ipc';
import type { Task, TaskStat } from '../task';

// name 验证规则：英文字符开头，可包含数字、'-'、'_'
const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/**
 * 验证工作区合规性，不合规则退出
 * @returns 合规的 name
 */
export const validateWorkspace = (): string => {
  const { exists } = checkSettings();
  if (!exists) {
    console.log(chalk.red(`fatal: this dir is not solo workspace:\`.solo\`, please use \`solo init\``));
    process.exit(1);
  }

  const name = readConfig().name;
  if (!name || !NAME_REGEX.test(name)) {
    console.log(chalk.red(`fatal: this dir is not solo workspace:\`.solo\`, please use \`solo init\``));
    process.exit(1);
  }

  return name;
};

/**
 * 计算字符串的终端显示宽度（宽字符 ✅❌ 及 CJK 等占 2 列）
 * @param s 输入字符串
 */
const displayWidth = (s: string): number => {
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

/**
 * 右补空格，使含宽字符的单元格与 ASCII 单元格显示宽度一致
 * cell 显示宽度 = 1(space) + displayWidth(content) + pad + 1(space)
 * 目标 cell 显示宽度 = targetWidth + 2
 * 因此 pad = targetWidth - displayWidth(s)
 * @param s 输入字符串
 * @param targetWidth 列最大显示宽度
 */
const padEndDisplay = (s: string, targetWidth: number): string => {
  const pad = targetWidth - displayWidth(s);
  return pad > 0 ? s + ' '.repeat(pad) : s;
};

/**
 * 格式化 agents 表格（含表头、边框、对齐）
 * @param results agent workspace 检查结果
 */
const formatAgentTable = (results: WorkspaceCheckResult[]): string[] => {
  const headers = ['name', 'status', 'workspaces'];
  const data = results.map(r => [r.name, r.exists ? '✅' : '❌', r.workspace]);

  const widths = headers.map((h, i) => Math.max(displayWidth(h), ...data.map(row => displayWidth(row[i]))));

  const mid = `┼${widths.map(w => '─'.repeat(w + 2)).join('┼')}┼`;
  const topLine = `┌${widths.map(w => '─'.repeat(w + 2)).join('┬')}┐`;
  const botLine = `└${widths.map(w => '─'.repeat(w + 2)).join('┴')}┘`;

  const fmtCells = (cells: string[]): string =>
    `│${cells.map((c, i) => ` ${padEndDisplay(c, widths[i])} `).join('│')}│`;

  const lines: string[] = [
    chalk.gray(topLine),
    chalk.gray(fmtCells(headers.map(h => chalk.cyan.bold(h)))),
    chalk.gray(mid),
    ...data.map(row => chalk.gray(fmtCells(row)))
  ];

  if (data.length > 0) {
    lines.push(chalk.gray(botLine));
  }

  return lines;
};

/**
 * 统计任务列表中各状态的数量（纯函数）
 * @param tasks 任务列表
 * @returns 各状态计数
 */
export const statTask = (tasks: Task[]): TaskStat => {
  const stat: TaskStat = { pending: 0, running: 0, completed: 0, timeout: 0, failed: 0, killed: 0 };
  for (const task of tasks) {
    stat[task.status]++;
  }
  return stat;
};

/**
 * 格式化 tasks 状态计数（右对齐标签 + 缩进 + 彩色数值）
 * 标签总宽度 = 最长标签长度 + 3（缓冲），所有冒号对齐在同一列
 * @param stat 各状态计数
 */
const formatTaskStatus = (stat: TaskStat): string[] => {
  const entries: [string, number][] = [
    ['pending', stat.pending],
    ['running', stat.running],
    ['completed', stat.completed],
    ['timeout', stat.timeout],
    ['failed', stat.failed],
    ['killed', stat.killed]
  ];
  const maxLen = Math.max(...entries.map(([k]) => k.length));
  const labelWidth = maxLen + 3;
  return entries.map(([key, val]) => {
    const label = chalk.gray(key.padStart(labelWidth) + ':');
    const color = val > 0 ? chalk.yellow : chalk.white;
    return `${label} ${color(String(val))}`;
  });
};

export const runStatus = async (): Promise<void> => {
  const name = validateWorkspace();
  const pid = readPidFile();
  const isDaemonAlive = pid !== null && isProcessAlive(pid);

  // name + pid
  console.log(chalk.gray('  name:') + ` ${chalk.white(name)}`);
  console.log(chalk.gray('   pid:') + ` ${isDaemonAlive ? chalk.white(String(pid)) : chalk.yellow('❓❓❓')}`);

  // agents table
  const results = checkAgentWorkspaces();
  console.log(chalk.gray('agents:'));
  for (const line of formatAgentTable(results)) {
    console.log(line);
  }

  // tasks（仅 daemon 存活时显示）
  if (!isDaemonAlive) {
    return;
  }

  try {
    const tasks = (await ipcListTasks()) as Task[];
    if (tasks.length === 0) {
      console.log(chalk.yellow('  📋 暂无任务'));
    } else {
      const stat = statTask(tasks);

      console.log(chalk.gray('tasks:'));
      for (const line of formatTaskStatus(stat)) {
        console.log(line);
      }
    }
  } catch {
    // IPC 连接失败，静默跳过
  }
};
