import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join, resolve } from 'path';

const { mockReadFile, mockWriteFile, mockExists } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockExists: vi.fn()
}));

vi.mock('../../src/utils/files', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  exists: mockExists,
  ensureDir: vi.fn(),
  appendFile: vi.fn(),
  stat: vi.fn(),
  readDir: vi.fn(),
  readStdin: vi.fn()
}));

import {
  countPromptStats,
  formatPromptIndexStats,
  parsePromptIndex,
  readPromptIndex,
  resetRunningStatuses,
  resolvePromptFilePath,
  updatePromptIndexStatus
} from '../../src/prompt';
import type { PromptIndexRow } from '../../src/prompt';

/** 三态索引样本 */
const INDEX = [
  '# prompt 索引',
  '',
  '共 3 个文件，done 1 个，running 1 个，todo 1 个。',
  '',
  '| 文件 | md5 | 状态 |',
  '| --- | --- | --- |',
  '| `.wuhua/agents/console/prompts/story-A.md` | `aaa` | done |',
  '| `.wuhua/agents/console/prompts/story-B.md` | `bbb` | running |',
  '| `.wuhua/agents/console/prompts/story-C.md` | `ccc` | todo |',
  ''
].join('\n');

/** 尚未含 running 的旧格式索引 */
const LEGACY_INDEX = [
  '# prompt 索引',
  '',
  '共 2 个文件，done 0 个，todo 2 个。',
  '',
  '| 文件 | md5 | 状态 |',
  '| --- | --- | --- |',
  '| `.wuhua/agents/console/prompts/story-A.md` | `aaa` | todo |',
  '| `.wuhua/agents/console/prompts/story-B.md` | `bbb` | todo |',
  ''
].join('\n');

/** 磁盘内容的可变替身：writeFile 后 readFile 能读到最新值，模拟真实读写 */
let fileContent: string | null = null;

/** 取本次写盘的完整内容 */
const writtenContent = (): string => mockWriteFile.mock.calls[0][1] as string;

describe('parsePromptIndex', () => {
  it('解析数据行，剥离反引号并拆出基名', () => {
    expect(parsePromptIndex(INDEX)).toEqual([
      {
        storedPath: '.wuhua/agents/console/prompts/story-A.md',
        fileName: 'story-A.md',
        md5: 'aaa',
        status: 'done'
      },
      {
        storedPath: '.wuhua/agents/console/prompts/story-B.md',
        fileName: 'story-B.md',
        md5: 'bbb',
        status: 'running'
      },
      {
        storedPath: '.wuhua/agents/console/prompts/story-C.md',
        fileName: 'story-C.md',
        md5: 'ccc',
        status: 'todo'
      }
    ]);
  });

  it('表头、分隔行与统计行都不被当作数据行', () => {
    expect(parsePromptIndex(INDEX)).toHaveLength(3);
  });

  it('未识别的状态归一为 todo', () => {
    const rows = parsePromptIndex('| `.wuhua/agents/console/prompts/story-A.md` | `aaa` | 未知 |');
    expect(rows[0].status).toBe('todo');
  });

  it('内容为空时返回空数组', () => {
    expect(parsePromptIndex(null)).toEqual([]);
  });
});

describe('countPromptStats / formatPromptIndexStats', () => {
  it('按状态计数并渲染统计行', () => {
    const stats = countPromptStats(parsePromptIndex(INDEX));
    expect(stats).toEqual({ total: 3, done: 1, running: 1, todo: 1 });
    expect(formatPromptIndexStats(stats)).toBe('共 3 个文件，done 1 个，running 1 个，todo 1 个。');
  });
});

describe('readPromptIndex', () => {
  it('读取索引文件并解析', () => {
    mockReadFile.mockReturnValue(INDEX);
    expect(readPromptIndex('/p/index.md')).toHaveLength(3);
  });
});

describe('updatePromptIndexStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileContent = INDEX;
    mockReadFile.mockImplementation(() => fileContent);
    mockWriteFile.mockImplementation((_path: string, content: string) => {
      fileContent = content;
    });
  });

  it('只改写目标行状态，其余行的路径与 md5 保持原样', () => {
    const isUpdated = updatePromptIndexStatus('/p/index.md', 'story-C.md', 'running');

    expect(isUpdated).toBe(true);
    const written = writtenContent();
    expect(written).toContain('| `.wuhua/agents/console/prompts/story-C.md` | `ccc` | running |');
    expect(written).toContain('| `.wuhua/agents/console/prompts/story-A.md` | `aaa` | done |');
    expect(written).toContain('| `.wuhua/agents/console/prompts/story-B.md` | `bbb` | running |');
  });

  it('同步重算统计行', () => {
    updatePromptIndexStatus('/p/index.md', 'story-C.md', 'done');

    expect(writtenContent()).toContain('共 3 个文件，done 2 个，running 1 个，todo 0 个。');
  });

  it('兼容不含 running 的旧统计行格式', () => {
    fileContent = LEGACY_INDEX;

    updatePromptIndexStatus('/p/index.md', 'story-A.md', 'running');

    expect(writtenContent()).toContain('共 2 个文件，done 0 个，running 1 个，todo 1 个。');
  });

  it('目标行不存在时不写盘', () => {
    const isUpdated = updatePromptIndexStatus('/p/index.md', 'nope.md', 'done');

    expect(isUpdated).toBe(false);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('索引文件不存在时不写盘', () => {
    fileContent = null;

    expect(updatePromptIndexStatus('/p/index.md', 'story-A.md', 'done')).toBe(false);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});

describe('resetRunningStatuses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileContent = INDEX;
    mockReadFile.mockImplementation(() => fileContent);
    mockWriteFile.mockImplementation((_path: string, content: string) => {
      fileContent = content;
    });
  });

  it('把残留的 running 全部回退为 todo，并返回条数', () => {
    const count = resetRunningStatuses('/p/index.md');

    expect(count).toBe(1);
    expect(parsePromptIndex(fileContent)[1].status).toBe('todo');
  });

  it('没有 running 时不写盘', () => {
    fileContent = LEGACY_INDEX;

    expect(resetRunningStatuses('/p/index.md')).toBe(0);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('索引文件不存在时返回 0', () => {
    fileContent = null;

    expect(resetRunningStatuses('/p/index.md')).toBe(0);
  });
});

describe('resolvePromptFilePath', () => {
  const row: PromptIndexRow = {
    storedPath: '.wuhua/agents/console/prompts/story-A.md',
    fileName: 'story-A.md',
    md5: 'aaa',
    status: 'todo'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('相对路径按当前工作目录解析', () => {
    mockExists.mockReturnValue(true);

    expect(resolvePromptFilePath(row, '/prompts')).toBe(resolve(process.cwd(), row.storedPath));
  });

  it('cwd 下不存在时回退到 prompts 目录的同名文件', () => {
    const fallback = join('/prompts', 'story-A.md');
    mockExists.mockImplementation((target: string) => target === fallback);

    expect(resolvePromptFilePath(row, '/prompts')).toBe(fallback);
  });

  it('绝对路径原样使用', () => {
    mockExists.mockReturnValue(true);
    const absoluteRow: PromptIndexRow = { ...row, storedPath: '/abs/story-A.md' };

    expect(resolvePromptFilePath(absoluteRow, '/prompts')).toBe('/abs/story-A.md');
  });

  it('两处都不存在时返回 null', () => {
    mockExists.mockReturnValue(false);

    expect(resolvePromptFilePath(row, '/prompts')).toBeNull();
  });
});
