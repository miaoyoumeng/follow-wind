import chalk from 'chalk';

import {
  sessionExists,
  createSession,
  createTmuxWindow,
  listPanes,
  setPaneTitle,
  sendKeys,
  registerHooks
} from '../tmux';
import { getAgents, type Agent } from '../agents';
import { readConfig } from '../config';
import { logger } from '../logging';
import { validateWorkspace } from './status';
import { getAgentPanesLayout, applyTwoPaneSplit, applyThreePaneSplit } from '../laytouts';
import { registerRouter } from '../task';
import { isDaemonRunning, writePidFile, startDaemon } from '../bootstrap';

/**
 * 为每个 pane 设置标题（tag 名）并执行 booter 命令
 */
const setPaneTitlesAndBooter = async (
  s: string,
  w: string,
  panes: Agent['panes'],
  tagToIdx: Record<string, number>
): Promise<void> => {
  if (!panes) {
    return;
  }
  for (const [tag, idx] of Object.entries(tagToIdx)) {
    await setPaneTitle(s, w, idx, tag);
    const booter = panes[tag]?.booter;
    if (booter) {
      await sendKeys(s, w, idx, booter);
    }
  }
};

/**
 * 为指定 agent 执行 pane 分屏布局
 * 根据 getAgentPanesLayout 返回的布局类型，内联执行 tmux split、设置标题、执行 booter
 */
const applyAgentLayout = async (sessionName: string, agent: Agent): Promise<void> => {
  const panes = agent.panes;
  if (!panes) {
    return;
  }
  const layout = getAgentPanesLayout(panes);
  if (!layout) {
    return;
  }
  const agentName = agent.name;
  const agentWorkspace = agent.workspace;
  const originalPane = Math.min(...(await listPanes(sessionName, agentName)));
  const entries = Object.entries(panes);
  let posToIdx: Record<string, number>;
  if (layout === 'One') {
    posToIdx = { [entries[0][1].layout]: originalPane };
  } else if (layout === 'Vertical') {
    posToIdx = await applyTwoPaneSplit(sessionName, agentName, entries, originalPane, agentWorkspace, '-h', {
      left: 0,
      right: 1
    });
  } else if (layout === 'LeftThreePane' || layout === 'RightThreePane') {
    posToIdx = await applyThreePaneSplit(sessionName, agentName, layout, originalPane, agentWorkspace);
  } else {
    posToIdx = await applyTwoPaneSplit(sessionName, agentName, entries, originalPane, agentWorkspace, '-v', {
      top: 0,
      bottom: 1
    });
  }
  const tagToIdx: Record<string, number> = {};
  const positions = Object.keys(posToIdx);
  entries.forEach(([tag], i) => {
    tagToIdx[tag] = posToIdx[positions[i]];
  });
  for (const idx of Object.values(tagToIdx)) {
    logger.debug(`register tmux router....session = ${sessionName}, window = ${agentName}, paneIndex = ${idx}`);
    registerRouter(sessionName, agentName, idx);
  }
  await setPaneTitlesAndBooter(sessionName, agentName, panes, tagToIdx);
};

/**
 * 读取配置 hooks.tmux 段并在 session 中注册启用的事件回调
 * 未知事件名会抛错终止 start（错误信息包含事件名）
 */
const registerConfiguredHooks = async (sessionName: string): Promise<void> => {
  const { hooks } = readConfig();
  const registered = await registerHooks(sessionName, hooks?.tmux);
  if (registered.length > 0) {
    logger.info(`[start] ✅ hooks 已注册: ${registered.join(', ')}`);
  }
};

export const runStart = async (): Promise<void> => {
  console.log(chalk.cyan('wuhua starting...'));
  const sessionName = validateWorkspace();
  // 检查 daemon 是否已运行（重复执行检测）
  if (isDaemonRunning()) {
    console.log(chalk.yellow(`wuhua 已在运行中（session: ${sessionName}），无需重复启动`));
    return;
  }

  console.log(chalk.yellow(`wuhua name [${sessionName}]`));
  logger.info(`[start] workspace validated, session name="${sessionName}"`);

  const exists = await sessionExists(sessionName);
  logger.info(`[start] session "${sessionName}" exists=${exists}`);

  if (exists) {
    console.log(chalk.yellow(`session "${sessionName}" 已存在，请使用 wuhua dashboard 进入`));
    return;
  }

  await createSession(sessionName, process.cwd());
  logger.info(`[start] session "${sessionName}" 已创建`);

  // 仅启动 activate: true 的 agent
  const activeAgents = getAgents().filter(agent => agent.activate);
  logger.info(`[start] active agents: [${activeAgents.map(a => a.name).join(', ')}]`);

  for (const agent of activeAgents) {
    const panes = agent.panes;
    if (!panes || getAgentPanesLayout(panes) === undefined) {
      console.log(chalk.red(`[agent:${agent.name}] panes 布局配置无效，请检查布局`));
      return;
    }
    logger.info(`[start] creating window "${agent.name}" workspace="${agent.workspace}"`);
    await createTmuxWindow(sessionName, agent.name, agent.workspace);
    await applyAgentLayout(sessionName, agent);
  }

  // 注册 hooks
  logger.debug('[start] registering tmux hooks.');
  await registerConfiguredHooks(sessionName);

  // 写入 PID 文件供后续 IPC 通信使用
  writePidFile();
  // 启动常住进程，维护 chatTaskStorage 单例
  startDaemon();
  console.log(chalk.green(`wuhua started, pid is ${process.pid}.`));
};
