import { Command } from 'commander';
import chalk from 'chalk';
import { sessionExists, createSession, attachSession, createWindow, listWindows, listPanes, registerHooks } from '../../tmux';
import { getAgents, resolveSplitPlan, resolveSplitAxis, panesLayout } from '../../core/agents';
import { readConfig, isValidPanePosition, type AgentPanes } from '../../core/yaml';
import { info } from '../../logging';
import { validateWorkspace } from '../status';
import type { Agent, SplitPlan } from '../../core/agents';

/**
 * 校验 panes 配置，返回 { plan, axis }；不合法时打印错误并返回 null
 * 新格式：panes 为 tag-keyed，layout 值须为合法位置
 */
const validatePanesConfig = (agentName: string, panes: AgentPanes): { plan: SplitPlan | null; axis: 'h' | 'v' | null } | null => {
  const entries = Object.entries(panes);
  if (entries.length === 0) {
    console.log(chalk.yellow(`agent "${agentName}" 未配置 panes`));
    return null;
  }
  const invalidLayouts = entries.filter(([, e]) => !isValidPanePosition(e.layout));
  if (invalidLayouts.length > 0) {
    const tags = invalidLayouts.map(([t]) => t).join(', ');
    console.log(chalk.red(`invalid panes: ${tags} 包含非法 layout 值`));
    return null;
  }
  const paneCount = entries.length;
  if (paneCount > 3) {
    console.log(chalk.red(`invalid panes: ${paneCount} panes is not supported, max 3`));
    return null;
  }
  const plan = resolveSplitPlan(panes);
  const axis = paneCount <= 2 ? resolveSplitAxis(panes) : null;
  if (paneCount === 3 && !plan) {
    console.log(chalk.red('invalid panes: unsupported 3-pane layout'));
    return null;
  }
  if (paneCount === 2 && !axis) {
    console.log(chalk.red('invalid panes: positions must share same row or same column'));
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
    console.log(chalk.yellow(`window [${agent.name}] 已按 panes 分屏`));
    return;
  }
  if (!win) await createWindow(sessionName, agent.name, agent.workspace);
  const originalPane = Math.min(...(await listPanes(sessionName, agent.name)));
  await panesLayout(sessionName, agent.name, panes, plan, axis, originalPane, agent.workspace);
  console.log(chalk.green(`✅ agent [${agent.name}] 已按 panes 配置完成分屏`));
};

/**
 * 读取配置 hooks 段并在 session 中注册启用的事件回调
 * 未知事件名会抛错终止 start（错误信息包含事件名）
 */
const registerConfiguredHooks = async (sessionName: string): Promise<void> => {
  const { hooks } = readConfig();
  const registered = await registerHooks(sessionName, hooks);
  if (registered.length > 0) {
    console.log(chalk.green(`✅ hooks 已注册: ${registered.join(', ')}`));
  }
};

export const runStart = async (): Promise<void> => {
  const sessionName = validateWorkspace();
  const exists = await sessionExists(sessionName);

  if (!exists) {
    await createSession(sessionName, process.cwd());
    info(`session ${sessionName} 已创建`);
    console.log(chalk.green(`✅ session ${sessionName} 已创建`));

    // 仅启动 activate: true 的 agent
    const activeAgents = getAgents().filter(agent => agent.activate);
    for (const agent of activeAgents) {
      await createWindow(sessionName, agent.name, agent.workspace);
      info(`window [${agent.name}] 已创建`);
      console.log(chalk.green(`  ✅ window [${agent.name}] 已创建`));
    }

    // 按 layout 分屏启动 activate 的 agent
    for (const agent of activeAgents) {
      await applyAgentLayout(sessionName, agent);
    }
  }

  // 每次 start 都重新注册 hooks（set-hook 幂等覆盖，session 已存在时注册先于进入）
  await registerConfiguredHooks(sessionName);

  if (exists) {
    await attachSession(sessionName);
    console.log(chalk.green(`✅ 已进入 session ${sessionName}`));
  }
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
