import { execa } from 'execa';

import { logger } from '../logging';
import type { ToolResult } from './types';

/**
 * 执行工具版本检测命令
 * @param command 可执行文件名（如 `git`）
 * @param args 命令参数列表（如 `['--version']`）
 * @param label 工具名称，用于日志
 * @returns 安装状态与版本号
 */
const detectTool = async (command: string, args: string[], label: string): Promise<ToolResult> => {
  try {
    const { stdout } = await execa(command, args);
    return { installed: true, version: stdout.trim() };
  } catch (err) {
    logger.debug(`[envs] ${label} detection failed: ${String(err)}`);
    return { installed: false };
  }
};

/**
 * 检测 git 是否安装
 * @returns git 安装状态与版本号
 */
export const checkGit = (): Promise<ToolResult> => detectTool('git', ['--version'], 'git');

/**
 * 检测 claude 是否安装
 * @returns claude 安装状态与版本号
 */
export const checkClaude = (): Promise<ToolResult> => detectTool('claude', ['--version'], 'claude');

/**
 * 检测 tmux 是否安装
 * @returns tmux 安装状态与版本号
 */
export const checkTmux = (): Promise<ToolResult> => detectTool('tmux', ['-V'], 'tmux');
