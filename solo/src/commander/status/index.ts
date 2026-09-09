import chalk from 'chalk';
import { checkSettings } from '../../core/checker';
import { readConfig } from '../../core/yaml';
import { checkAgentWorkspaces } from '../../core/agents';
import { getTaskSummary } from '../../task';

// name 验证规则：英文字符开头，可包含数字、'-'、'_'
const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/**
 * 验证工作区合规性，不合规则退出
 * @returns 合规的 name
 */
export const validateWorkspace = (): string => {
  // 检查 .solo/config 是否存在
  const { exists } = checkSettings();
  if (!exists) {
    console.log(chalk.red(`fatal: this dir is not solo workspace:\`.solo\`, please use \`solo init\``));
    process.exit(1);
  }

  // 检查 name 是否合规
  const name = readConfig().name;
  if (!name || !NAME_REGEX.test(name)) {
    console.log(chalk.red(`fatal: this dir is not solo workspace:\`.solo\`, please use \`solo init\``));
    process.exit(1);
  }

  return name;
};

export const runStatus = async (): Promise<void> => {
  const name = validateWorkspace();
  const workspaceResults = checkAgentWorkspaces();

  // 检查是否有异常
  const hasIssue = workspaceResults.some(r => !r.exists);

  if (hasIssue) {
    console.log(chalk.yellow.bold('⚠️  solo workspace has issues:'));
  } else {
    console.log(chalk.green.bold('✅ solo workspace is ready'));
  }
  console.log(chalk.gray(`  name: ${name}`));

  // 显示每个 agent 的状态
  for (const result of workspaceResults) {
    if (!result.exists) {
      console.log(chalk.red(`  ✗ ${result.name}: workspace 不存在 → ${result.workspace}`));
      console.log(chalk.gray(`    请修改 .solo/config 中的 workspace 配置`));
    } else if (result.settingsCreated) {
      console.log(chalk.cyan(`  ○ ${result.name}: .claude/settings.json 已创建`));
    } else {
      console.log(chalk.green(`  ✓ ${result.name}: ${result.workspace}`));
    }
  }

  // 显示任务状态统计
  const summary = getTaskSummary();
  console.log(
    chalk.gray(`  tasks: ${summary.pending} pending, ${summary.running} running, ${summary.completed} completed, ${summary.timeout} timeout`)
  );
};
