import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// INI 文件结构类型
export interface IniData {
  [section: string]: {
    [key: string]: string;
  };
}

// 默认配置文件路径
const CONFIG_DIR = join(process.cwd(), '.solo');
const CONFIG_PATH = join(CONFIG_DIR, 'config');

/**
 * 解析 INI 文件内容
 */
export function parseIni(content: string): IniData {
  const result: IniData = {};
  let currentSection = '';

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      continue;
    }

    // 节（Section）
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      continue;
    }

    // 键值对（Key-value pair）
    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch && currentSection) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      result[currentSection][key] = value;
    }
  }

  return result;
}

/**
 * 将数据序列化为 INI 格式
 */
export function stringifyIni(data: IniData): string {
  const lines: string[] = [];

  for (const section of Object.keys(data)) {
    lines.push(`[${section}]`);
    for (const [key, value] of Object.entries(data[section])) {
      lines.push(`    ${key} = ${value}`);
    }
    lines.push(''); // 节之间添加空行
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * 读取配置文件
 */
export function readConfig(): IniData {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  const content = readFileSync(CONFIG_PATH, 'utf-8');
  return parseIni(content);
}

/**
 * 写入配置文件
 */
export function writeConfig(data: IniData): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const content = stringifyIni(data);
  writeFileSync(CONFIG_PATH, content, 'utf-8');
}

/**
 * 获取指定节的值
 */
export function getConfigValue(section: string, key: string): string | undefined {
  const data = readConfig();
  return data[section]?.[key];
}

/**
 * 设置指定节的值
 */
export function setConfigValue(section: string, key: string, value: string): void {
  const data = readConfig();
  if (!data[section]) {
    data[section] = {};
  }
  data[section][key] = value;
  writeConfig(data);
}

/**
 * 删除指定节的值
 */
export function deleteConfigValue(section: string, key: string): void {
  const data = readConfig();
  if (data[section]) {
    delete data[section][key];
    if (Object.keys(data[section]).length === 0) {
      delete data[section];
    }
    writeConfig(data);
  }
}

/**
 * 删除整个节
 */
export function deleteSection(section: string): void {
  const data = readConfig();
  delete data[section];
  writeConfig(data);
}

/**
 * 检查配置文件是否存在
 */
export function configExists(): boolean {
  return existsSync(CONFIG_PATH);
}
