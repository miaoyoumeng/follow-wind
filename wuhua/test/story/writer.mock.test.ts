import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';

const { mockExists, mockReadFile, mockWriteFile, mockEnsureDir, mockReadDir } = vi.hoisted(() => ({
  mockExists: vi.fn(),
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockEnsureDir: vi.fn(),
  mockReadDir: vi.fn()
}));

// fs 是外部边界，mock 以隔离磁盘读写
vi.mock('../../src/utils/files', () => ({
  exists: mockExists,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  ensureDir: mockEnsureDir,
  readDir: mockReadDir
}));

import { ensureOutputDirs, createTopicFiles, writePromptFile, writePromptIndex } from '../../src/story';

const FEATURE_DIR = '/proj/feature';
const PROMPT_DIR = join(process.cwd(), '.wuhua', 'prompts');

describe('ensureOutputDirs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('只创建 story 目录，不创建 prd 目录', () => {
    ensureOutputDirs(FEATURE_DIR);

    expect(mockEnsureDir).toHaveBeenCalledWith(join(FEATURE_DIR, 'story'));
    expect(mockEnsureDir).not.toHaveBeenCalledWith(join(FEATURE_DIR, 'prd'));
  });
});

describe('createTopicFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('不在 prd 目录下创建 markdown 文件', () => {
    createTopicFiles(FEATURE_DIR, '用户管理-今日用户');

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('创建与主题同名的 story 目录', () => {
    mockExists.mockReturnValue(false);

    createTopicFiles(FEATURE_DIR, '用户管理-今日用户');

    expect(mockEnsureDir).toHaveBeenCalledWith(join(FEATURE_DIR, 'story', '用户管理-今日用户'));
  });
});

describe('writePromptFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('写入 prompts/story-<主题>.md 并返回其路径', () => {
    const result = writePromptFile(PROMPT_DIR, '用户管理-今日用户', '--prompt="x"');

    const expected = join(PROMPT_DIR, 'story-用户管理-今日用户.md');
    expect(result).toBe(expected);
    expect(mockWriteFile).toHaveBeenCalledWith(expected, '--prompt="x"');
  });
});

describe('writePromptIndex', () => {
  // md5("A") 与 md5("B")，用于验证表格记录的是文件内容签名
  const md5OfA = '7fc56270e7a70fa81a5935b72eacbe29';
  const md5OfB = '9d5ed678fe57bcca610140957afab571';

  beforeEach(() => {
    vi.clearAllMocks();
    mockExists.mockReturnValue(false);
    mockReadDir.mockReturnValue([]);
    mockReadFile.mockReturnValue(null);
  });

  it('只索引 markdown 文件，跳过 index.md 与其他扩展名', () => {
    mockReadDir.mockReturnValue(['index.md', 'story-A.md', 'notes.txt']);
    mockReadFile.mockReturnValue('A');

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content).toContain('| `.wuhua/prompts/story-A.md` |');
    expect(content).not.toContain('index.md` |');
    expect(content).not.toContain('notes.txt');
  });

  it('按文件名排序输出，保证多次执行顺序一致', () => {
    mockReadDir.mockReturnValue(['story-B.md', 'story-A.md']);
    mockReadFile.mockReturnValue(null);

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content.indexOf('story-A.md')).toBeLessThan(content.indexOf('story-B.md'));
  });

  it('每行记录相对路径、md5 与状态', () => {
    mockReadDir.mockReturnValue(['story-A.md']);
    mockReadFile.mockImplementation((p: string) => (p.endsWith('index.md') ? null : 'A'));

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content).toContain('| 文件 | md5 | 状态 |');
    expect(content).toContain(`| \`.wuhua/prompts/story-A.md\` | \`${md5OfA}\` | todo |`);
  });

  it('统计行输出总数与 done / todo 数量', () => {
    mockReadDir.mockReturnValue(['story-A.md', 'story-B.md']);
    mockReadFile.mockImplementation((p: string) => (p.endsWith('story-A.md') ? 'A' : 'B'));

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content).toContain('共 2 个文件，done 0 个，running 0 个，todo 2 个。');
  });

  it('保留已有索引中标记为 done 的状态', () => {
    const existingIndex = [
      '| 文件 | md5 | 状态 |',
      '| --- | --- | --- |',
      '| `.wuhua/prompts/story-A.md` | `old-signature` | done |'
    ].join('\n');
    mockReadDir.mockReturnValue(['story-A.md', 'story-B.md']);
    mockReadFile.mockImplementation((p: string) => {
      if (p.endsWith('index.md')) {
        return existingIndex;
      }
      return p.endsWith('story-A.md') ? 'A' : 'B';
    });

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content).toContain(`| \`.wuhua/prompts/story-A.md\` | \`${md5OfA}\` | done |`);
    expect(content).toContain(`| \`.wuhua/prompts/story-B.md\` | \`${md5OfB}\` | todo |`);
    expect(content).toContain('共 2 个文件，done 1 个，running 0 个，todo 1 个。');
  });

  it('保留已有索引中标记为 running 的状态（wuhua prompt 执行中的行不被抹回 todo）', () => {
    const existingIndex = [
      '| 文件 | md5 | 状态 |',
      '| --- | --- | --- |',
      '| `.wuhua/prompts/story-A.md` | `old-signature` | running |'
    ].join('\n');
    mockReadDir.mockReturnValue(['story-A.md', 'story-B.md']);
    mockReadFile.mockImplementation((p: string) => {
      if (p.endsWith('index.md')) {
        return existingIndex;
      }
      return p.endsWith('story-A.md') ? 'A' : 'B';
    });

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content).toContain(`| \`.wuhua/prompts/story-A.md\` | \`${md5OfA}\` | running |`);
    expect(content).toContain(`| \`.wuhua/prompts/story-B.md\` | \`${md5OfB}\` | todo |`);
    expect(content).toContain('共 2 个文件，done 0 个，running 1 个，todo 1 个。');
  });

  it('索引文件不存在时全部标记为 todo', () => {
    mockReadDir.mockReturnValue(['story-A.md', 'story-B.md']);
    mockReadFile.mockImplementation((p: string) =>
      p.endsWith('index.md') ? null : p.endsWith('story-A.md') ? 'A' : 'B'
    );

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content).toContain(`| \`.wuhua/prompts/story-A.md\` | \`${md5OfA}\` | todo |`);
    expect(content).toContain(`| \`.wuhua/prompts/story-B.md\` | \`${md5OfB}\` | todo |`);
    expect(content).toContain('共 2 个文件，done 0 个，running 0 个，todo 2 个。');
  });

  it('文件内容读不到时 md5 记为空串', () => {
    mockReadDir.mockReturnValue(['story-A.md']);
    mockReadFile.mockReturnValue(null);

    writePromptIndex(PROMPT_DIR);

    const content = mockWriteFile.mock.calls[0][1] as string;
    expect(content).toContain('| `.wuhua/prompts/story-A.md` | `` | todo |');
  });

  it('写入 index.md 并返回其路径', () => {
    const result = writePromptIndex(PROMPT_DIR);

    const expected = join(PROMPT_DIR, 'index.md');
    expect(result).toBe(expected);
    expect(mockWriteFile.mock.calls[0][0]).toBe(expected);
  });
});
