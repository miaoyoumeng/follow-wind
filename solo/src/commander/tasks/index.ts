import { Command } from 'commander';
import chalk from 'chalk';
import { validateWorkspace } from '../status';
import { listTasks } from '../../task';

/**
 * 列出所有后台任务
 */
export const runTasks = async (): Promise<void> => {
  validateWorkspace();
  const tasks = listTasks();

  if (tasks.length === 0) {
    console.log(chalk.yellow('📋 暂无任务'));
    return;
  }

  console.log(chalk.cyan(`📋 共 ${tasks.length} 个任务：`));
  for (const task of tasks) {
    const statusIcon = task.status === 'completed' ? '✅' : task.status === 'timeout' ? '⏰' : '⏳';
    console.log(`  ${statusIcon} ${task.id} | agent: ${task.agentName} | status: ${task.status} | pid: ${task.pid ?? '-'}`);
  }
};

/**
 * 注册 solo tasks 子命令
 * @param program commander 实例
 */
export const registerTasksCommand = (program: Command): void => {
  program
    .command('tasks')
    .description('列出所有后台任务')
    .action(async () => {
      await runTasks();
    });
};
