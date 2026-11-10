import { gitbookFile } from './files.js';
import { NavItem } from '../../typings/global.js';
/**
 * GitBook SUMMARY.md 导航树解析器
 * 用于解析 GitBook 风格的 SUMMARY.md 文件并生成菜单导航树
 */

/**
 * 正则表达式：匹配 Markdown 无序列表项
 * 格式：* [title](path) 或 * [title]()
 * 捕获组：1-缩进空格数，2-标题，3-路径
 */
const LIST_ITEM_REGEX = /^(\s*)\*\s*\[([^\]]*)\]\(([^)]*)\)\s*$/;

/**
 * 计算缩进层级
 * @param spaces - 缩进空格字符串
 * @returns 层级深度（每 2 个空格为一级）
 */
const calculateLevel = (spaces: string): number => {
  const spaceCount = spaces.length;
  // GitBook 使用 2 个空格表示一级缩进
  return Math.floor(spaceCount / 2);
};

/**
 * 解析单行列表项
 * @param line - 列表行内容
 * @returns 解析结果对象，如果匹配失败则返回 null
 */
const parseListItem = (line: string): { title: string; path?: string; level: number } | null => {
  const match = line.match(LIST_ITEM_REGEX);
  if (!match) {
    return null;
  }

  const [, spaces, title, path] = match;
  const level = calculateLevel(spaces);

  // 空链接处理：空字符串或 # 视为无实际链接
  const validPath = path && path !== '' && path !== '#' ? path : undefined;

  return {
    title,
    path: validPath,
    level
  };
};

/**
 * 解析 SUMMARY.md 生成导航树
 * @param content - SUMMARY.md 文件内容
 * @returns NavItem[] - 导航树数组
 */
const parseSummary = (content: string): NavItem[] => {
  const lines = content.split('\n');
  const result: NavItem[] = [];
  const stack: { item: NavItem; level: number }[] = [];

  for (const line of lines) {
    // 跳过空行和标题行（# 开头）
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const parsed = parseListItem(line);
    if (!parsed) {
      continue;
    }

    const { title, path, level } = parsed;
    const newItem: NavItem = {
      title,
      path,
      level
    };

    // 维护栈结构，确保栈顶元素的层级小于当前项层级
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // 顶层节点
      result.push(newItem);
    } else {
      // 作为栈顶节点的子节点
      const parent = stack[stack.length - 1].item;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(newItem);
    }

    // 将当前节点压入栈
    stack.push({ item: newItem, level });
  }

  return result;
};

export const gitbookNavigators = async (): Promise<NavItem[]> => {
  const summary: string | null = await gitbookFile('SUMMARY.md');
  if (summary) {
    return parseSummary(summary);
  }
  return [];
};
