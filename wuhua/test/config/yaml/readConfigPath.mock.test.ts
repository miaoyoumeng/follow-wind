import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFileSync, mockExistsSync, mockWriteFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockExistsSync: vi.fn(() => true),
  mockWriteFileSync: vi.fn()
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: vi.fn()
}));

import { readConfig, configExists, writeConfig } from '../../../src/config/yaml/writer';

describe('readConfig 接受 configPath 参数', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it('传入 configPath 时从指定路径读取', () => {
    mockReadFileSync.mockReturnValue("name: 'custom-project'\n");
    const config = readConfig('/custom/path/config.yaml');
    expect(mockReadFileSync).toHaveBeenCalledWith('/custom/path/config.yaml', 'utf-8');
    expect(config.name).toBe('custom-project');
  });

  it('不传 configPath 时使用 getConfigPath() 返回的路径', () => {
    mockReadFileSync.mockReturnValue("name: 'default'\n");
    readConfig();
    expect(mockReadFileSync).toHaveBeenCalled();
    const calledPath = mockReadFileSync.mock.calls[0][0] as string;
    expect(calledPath).toContain('.solo');
    expect(calledPath).toContain('config');
  });
});

describe('configExists 接受 configPath 参数', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('传入 configPath 时检查指定路径', () => {
    mockExistsSync.mockReturnValue(true);
    configExists('/custom/config.yaml');
    expect(mockExistsSync).toHaveBeenCalledWith('/custom/config.yaml');
  });
});

describe('writeConfig 接受 configPath 参数', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it('传入 configPath 时写入指定路径', () => {
    writeConfig({ name: 'test' }, '/custom/output.yaml');
    expect(mockWriteFileSync).toHaveBeenCalled();
    const calledPath = mockWriteFileSync.mock.calls[0][0] as string;
    expect(calledPath).toBe('/custom/output.yaml');
  });
});
