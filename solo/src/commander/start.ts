import { Command } from 'commander';
import chalk from 'chalk';

import { sessionExists, createSession, createWindow, listWindows, listPanes, registerHooks } from '../tmux';
import { getAgents, resolveSplitPlan, resolveSplitAxis, panesLayout, type Agent, SplitPlan } from '../agents';
import { readConfig, isValidPanePosition, type AgentPanes } from '../config';
import { debug } from '../logging';
import { validateWorkspace } from './status';
import { registerTask } from '../task';
import { startWorker } from '../process/wait';
import { writePidFile, readPidFile, isProcessAlive, startDaemon } from '../process';

/**
 * 校验 panes 配置，返回 { plan, axis }；不合法时打印错误并返回 null
 * 新格式：panes 为 tag-keyed，layout 值须为合法位置
 */
const validatePanesConfig = (
  agentName: string,
  panes: AgentPanes
): { plan: SplitPlan | null; axis: 'h' | 'v' | null } | null => {
  const entries = Object.entries(panes);
  if (entries.length === 0) {
    debug(`[start] agent "${agentName}" 未配置 panes`);
    return null;
  }
  const invalidLayouts = entries.filter(([, e]) => !isValidPanePosition(e.layout));
  if (invalidLayouts.length > 0) {
    const tags = invalidLayouts.map(([t]) => t).join(', ');
    debug(`[start] invalid panes: ${tags} 包含非法 layout 值`);
    return null;
  }
  const paneCount = entries.length;
  if (paneCount > 3) {
    debug(`[start] invalid panes: ${paneCount} panes is not supported, max 3`);
    return null;
  }
  const plan = resolveSplitPlan(panes);
  const axis = paneCount <= 2 ? resolveSplitAxis(panes) : null;
  if (paneCount === 3 && !plan) {
    debug('[start] invalid panes: unsupported 3-pane layout');
    return null;
  }
  if (paneCount === 2 && !axis) {
    debug('[start] invalid panes: positions must share same row or same column');
    return null;
  }
  return { plan, axis };
};

/**
 * 为指定 agent 执行 pane 分屏布局
 */
const applyAgentLayout = async (sessionName: string, agent: Agent): Promise<void> => {
  const panes = agent.panes;
  if (!panes) return;
  const validated = validatePanesConfig(agent.name, panes);
  if (!validated) return;
  const { plan, axis } = validated;
  const windows = await listWindows(sessionName);
  const win = windows.find(w => w.name === agent.name);
  if (win && win.panes !== 1) {
    debug(`[start] window [${agent.name}] 已按 panes 分屏，跳过`);
    return;
  }
  if (!win) {
    debug(`[start] window [${agent.name}] 不存在，创建中`);
    await createWindow(sessionName, agent.name, agent.workspace);
  }
  const originalPane = Math.min(...(await listPanes(sessionName, agent.name)));
  debug(
    `[start] agent "${agent.name}" originalPane=${originalPane}, plan=${plan?.pattern ?? 'null'}, axis=${axis ?? 'null'}`
  );
  await panesLayout(sessionName, agent.name, panes, plan, axis, originalPane, agent.workspace);
  debug(`[start] ✅ agent [${agent.name}] 已按 panes 配置完成分屏`);
};

/**
 * 读取配置 hooks 段并在 session 中注册启用的事件回调
 * 未知事件名会抛错终止 start（错误信息包含事件名）
 */
const registerConfiguredHooks = async (sessionName: string): Promise<void> => {
  const { hooks } = readConfig();
  const registered = await registerHooks(sessionName, hooks);
  if (registered.length > 0) {
    debug(`[start] ✅ hooks 已注册: ${registered.join(', ')}`);
  }
};

/**
 * 检查 daemon 进程是否已运行
 * @returns true 表示已运行（应跳过启动），false 表示未运行
 */
const isDaemonRunning = (): boolean => {
  const pid = readPidFile();
  return pid !== null && isProcessAlive(pid);
};

/**
 * 为指定 agent 的所有 pane 注册轮询任务并启动 worker
 * @param sessionName tmux session 名
 * @param agent agent 配置
 */
const registerAgentTasks = async (sessionName: string, agent: Agent): Promise<void> => {
  const panes = await listPanes(sessionName, agent.name);
  debug(`[start] agent "${agent.name}" has ${panes.length} pane(s): [${panes.join(', ')}]`);
  for (const paneIndex of panes) {
    const taskId = registerTask({
      agentName: agent.name,
      session: sessionName,
      window: agent.name,
      paneIndex
    });
    const pid = startWorker(taskId, sessionName, agent.name, paneIndex, agent.name);
    debug(`[start] task ${taskId} registered (pid: ${pid}) for agent "${agent.name}" pane ${paneIndex}`);
  }
};

export const runStart = async (): Promise<void> => {
  console.log(chalk.cyan('solo starting...'));

  const sessionName = validateWorkspace();

  // 检查 daemon 是否已运行（重复执行检测）
  if (isDaemonRunning()) {
    console.log(chalk.yellow(`solo 已在运行中（session: ${sessionName}），无需重复启动`));
    return;
  }

  console.log(chalk.yellow(`solo name [${sessionName}]`));
  debug(`[start] workspace validated, sessionName="${sessionName}"`);

  const exists = await sessionExists(sessionName);
  debug(`[start] session "${sessionName}" exists=${exists}`);

  if (!exists) {
    await createSession(sessionName, process.cwd());
    debug(`[start] session "${sessionName}" 已创建`);

    // 仅启动 activate: true 的 agent
    const activeAgents = getAgents().filter(agent => agent.activate);
    debug(`[start] active agents: [${activeAgents.map(a => a.name).join(', ')}]`);

    for (const agent of activeAgents) {
      debug(`[start] creating window "${agent.name}" workspace="${agent.workspace}"`);
      await createWindow(sessionName, agent.name, agent.workspace);
    }

    // 按 layout 分屏启动 activate 的 agent
    for (const agent of activeAgents) {
      debug(`[start] applying layout for agent "${agent.name}"`);
      await applyAgentLayout(sessionName, agent);
    }
  }

  // 每次 start 都重新注册 hooks（set-hook 幂等覆盖，session 已存在时注册先于进入）
  debug('[start] registering hooks');
  await registerConfiguredHooks(sessionName);

  // 为每个 active agent 的每个 pane 注册轮询任务并启动 worker
  const activeAgents = getAgents().filter(agent => agent.activate);
  for (const agent of activeAgents) {
    await registerAgentTasks(sessionName, agent);
  }

  // 写入 PID 文件供后续 IPC 通信使用
  writePidFile();

  // 启动常住进程，维护 taskStorage 单例
  startDaemon();

  console.log(chalk.green(`solo started, pid is ${process.pid}.`));
};

export const registerStartCommand = (program: Command): void => {
  program
    .command('start')
    .description('启动本项目的 tmux session')
    .allowExcessArguments(false)
    .action(async () => {
      await runStart();
    });
};
