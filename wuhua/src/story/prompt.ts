import type { StoryPromptInput } from './types';

/**
 * 在 [min, max] 闭区间内随机取一个整数
 * @param min 下限（含）
 * @param max 上限（含）
 * @param random 随机源，返回 [0, 1) 区间的小数，默认为 Math.random
 * @returns prompt 条数
 */
export const randomPromptCount = (min: number, max: number, random: () => number = Math.random): number =>
  min + Math.floor(random() * (max - min + 1));

/**
 * 构建单条 user story 的 prompt 片段
 * @param input 生成输入
 * @param index 序号（从 1 开始）
 * @returns 单条 --prompt 片段
 */
const buildItem = (input: StoryPromptInput, index: number): string => {
  const { role, product } = input.config;
  const lines = [
    `--prompt="您的工作是\`${role.name}\`，现在在规划一个系统产品\`${product.name}\`，`,
    `围绕\`${input.topic}\`主题，请您扮演为\`${product.story.as}\`角色，生成第 ${index} 条 user story。`,
    '严格规避空泛描述，所有价值表述必须落地到具体的业务操作流程，验收标准中不得出现各类模糊词汇。'
  ];
  // 首条没有「之前」可比，从第 2 条起追加区分要求
  if (index > 1) {
    lines.push('内容不得与之前的一致。');
  }
  return `${lines.join('\n')}"`;
};

/**
 * 生成某主题的完整 prompt 文本
 * @param input 生成输入
 * @returns 可直接交给 claude 执行的 prompt 文本
 */
export const buildStoryPrompt = (input: StoryPromptInput): string => {
  const items = Array.from({ length: input.count }, (_, index) => buildItem(input, index + 1));
  return `/sunny:commander-story ${input.config.role.chat.model}\n${items.join(' \n')}\n--dir=${input.storyFolder}\n`;
};
