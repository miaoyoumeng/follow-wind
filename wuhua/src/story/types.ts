import type { ResolvedCompanyConfig } from '../config';

/** 生成一条主题的 story prompt 所需的输入 */
export interface StoryPromptInput {
  /** 叶子主题路径，如「用户管理-今日用户」 */
  topic: string;
  /** 该主题对应的 story 目录绝对路径 */
  storyFolder: string;
  /** 配置文件中 company 段的解析结果 */
  config: ResolvedCompanyConfig;
  /** 生成的 prompt 条数 */
  count: number;
}
