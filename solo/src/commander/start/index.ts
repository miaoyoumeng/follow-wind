import { Command } from 'commander';
import chalk from 'chalk';
import { sessionExists, createSession, attachSession, createWindow, listWindows, listPanes } from '../../tmux';
import { getAgents, resolveSplitPlan, resolveSplitAxis, panesLayout } from '../../core/agents';
import { isValidPanePosition, type AgentPanes } from '../../core/yaml';
import { validateWorkspace } from '../status';
import type { Agent, SplitPlan } from '../../core/agents';

/**
 * 校验 panes 配置，返回 { plan, axis }；不合法时打印错误并返回 null
 */
const validatePanesConfig = (agentName: string, panes: AgentPanes): { plan: SplitPlan | null; axis: 'h' | 'v' | null } | null => {
  if (Object.keys(panes).length === 0) {
    console.log(chalk.yellow(`agent "${agentName}" 未配置 panes`));
    return null;
  }
  const invalidKeys = Object.keys(panes).filter(k => !isValidPanePosition(k));
  if (invalidKeys.length > 0) {
    console.log(chalk.red(`invalid panes: 包含非法位置 key: ${invalidKeys.join(', ')}`));
    return null;
  }
  const paneCount = Object.keys(panes).length;
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

export const runStart = async (): Promise<void> => {
  const sessionName = validateWorkspace();
  const exists = await sessionExists(sessionName);

  if (!exists) {
    await createSession(sessionName, process.cwd());
    console.log(chalk.green(`✅ session ${sessionName} 已创建`));

    // 仅启动 activate: true 的 agent
    const activeAgents = getAgents().filter(agent => agent.activate);
    for (const agent of activeAgents) {
      await createWindow(sessionName, agent.name, agent.workspace);
      console.log(chalk.green(`  ✅ window [${agent.name}] 已创建`));
    }

    // 按 layout 分屏启动 activate 的 agent
    for (const agent of activeAgents) {
      await applyAgentLayout(sessionName, agent);
    }
  } else {
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
