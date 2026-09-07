import { Command } from 'commander';
import chalk from 'chalk';
import { parseAgentArgs } from './parse';
import { runAgentAdd } from './add';
import { runAgentWorkspace, runAgentPanes } from './show';
import { validateWorkspace } from '../status';

const AGENT_USAGE = `用法:
  solo agent add <name> <path>    添加 agent
  solo agent <name> workspace     显示指定 agent 的 workspace
  solo agent <name> panes         显示指定 agent 的 panes`;

const ADD_MISSING_ARGS_MSG = "error: missing required argument 'name' and 'path'，please use `solo agent add [name] [path]`";

const handleAgentAction = async (cmd: ReturnType<typeof parseAgentArgs>, tokens: string[]): Promise<void> => {
  switch (cmd.kind) {
    case 'help':
      console.log(chalk.yellow(AGENT_USAGE));
      return;
    case 'error': {
      const isAdd = tokens[0] === 'add';
      console.log(chalk.red(isAdd ? ADD_MISSING_ARGS_MSG : 'error: invalid arguments'));
      if (!isAdd) console.log(chalk.yellow(AGENT_USAGE));
      return;
    }
    case 'add':
      await runAgentAdd(cmd.name, cmd.path);
      return;
    case 'workspace':
      validateWorkspace();
      await runAgentWorkspace(cmd.name);
      return;
    case 'panes':
      validateWorkspace();
      await runAgentPanes(cmd.name);
  }
};

export const registerAgentCommand = (program: Command): void => {
  const agent = program
    .command('agent')
    .description('agent 管理命令')
    .argument('[args...]', 'add <name> <path> | <name> workspace | <name> panes')
    .action(async (rawArgs: string[]) => {
      const tokens = rawArgs[0] === agent.name() ? rawArgs.slice(1) : rawArgs;
      await handleAgentAction(parseAgentArgs(tokens), tokens);
    });
};
