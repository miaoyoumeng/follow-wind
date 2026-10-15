import { describe, it, expect } from 'vitest';
import { buildStoryPrompt, randomPromptCount, type StoryPromptInput } from '../../src/story';

const config = {
  role: { name: '产品经理', chat: { model: 'yuanbao' } },
  product: { name: '后台管理系统', story: { as: '后台管理员', min: 2, max: 5 } },
  description: '公司人数不超过5人'
};

const input = (count: number): StoryPromptInput => ({
  topic: '用户管理-今日用户',
  storyFolder: '/proj/story/用户管理-今日用户',
  config,
  count
});

describe('randomPromptCount', () => {
  it('随机值为 0 时返回下限', () => {
    expect(randomPromptCount(2, 5, () => 0)).toBe(2);
  });

  it('随机值接近 1 时返回上限', () => {
    expect(randomPromptCount(2, 5, () => 0.999)).toBe(5);
  });

  it('返回区间内的整数', () => {
    // 0.5 → 2 + floor(0.5 × 4) = 4
    expect(randomPromptCount(2, 5, () => 0.5)).toBe(4);
  });

  it('下限等于上限时固定返回该值', () => {
    expect(randomPromptCount(3, 3, () => 0.5)).toBe(3);
  });
});

describe('buildStoryPrompt', () => {
  it('以「/sunny:commander-story <chat.model>」开头', () => {
    const prompt = buildStoryPrompt(input(2));

    expect(prompt.startsWith('/sunny:commander-story yuanbao\n')).toBe(true);
  });

  it('结尾输出指向 story 目录的 --dir 参数', () => {
    const prompt = buildStoryPrompt(input(2));

    expect(prompt.endsWith('--dir=/proj/story/用户管理-今日用户\n')).toBe(true);
  });

  it('把工作标题、产品名、主题、角色注入文案', () => {
    const prompt = buildStoryPrompt(input(1));

    expect(prompt).toContain('您的工作是`产品经理`');
    expect(prompt).toContain('系统产品`后台管理系统`');
    expect(prompt).toContain('围绕`用户管理-今日用户`主题');
    expect(prompt).toContain('扮演为`后台管理员`角色');
  });

  it('按 count 生成对应条数的 prompt', () => {
    const prompt = buildStoryPrompt(input(3));

    expect(prompt.match(/--prompt="/g)).toHaveLength(3);
  });

  it('每条 prompt 标注自己的序号', () => {
    const prompt = buildStoryPrompt(input(3));

    expect(prompt).toContain('生成第 1 条 user story');
    expect(prompt).toContain('生成第 2 条 user story');
    expect(prompt).toContain('生成第 3 条 user story');
  });

  it('首条 prompt 不要求与之前内容区分', () => {
    const prompt = buildStoryPrompt(input(2));
    const first = prompt.slice(0, prompt.indexOf('生成第 2 条'));

    expect(first).not.toContain('内容不得与之前的一致');
  });

  it('第二条及之后要求与之前内容区分', () => {
    const prompt = buildStoryPrompt(input(3));
    const rest = prompt.slice(prompt.indexOf('生成第 2 条'));

    expect(rest.match(/内容不得与之前的一致。/g)).toHaveLength(2);
  });

  it('多条 prompt 之间以「空格 + 换行」分隔', () => {
    const prompt = buildStoryPrompt(input(2));

    expect(prompt).toContain('" \n--prompt="');
  });
});
