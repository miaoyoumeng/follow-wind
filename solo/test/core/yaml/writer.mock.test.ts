import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn()
}));

// 文件 IO 是最低层外部依赖，mock 以隔离 readConfig 的解析逻辑
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: mockReadFileSync,
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

import { readConfig } from '../../../src/core/yaml/writer';

describe('readConfig hooks 解析', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
  });

  it('解析顶级 hooks 段：保留 boolean 值条目', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
agents:
  pm:
    workspace: '/pm'
hooks:
    alert-activity: true
    after-send-keys: true
    alert-bell: false
`);
    const config = readConfig();
    expect(config.hooks).toEqual({
      'alert-activity': true,
      'after-send-keys': true,
      'alert-bell': false
    });
  });

  it('hooks 值为非 boolean（字符串/数字）时过滤丢弃', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
agents:
  pm:
    workspace: '/pm'
hooks:
    alert-activity: true
    after-send-keys: 'true'
    alert-bell: 1
`);
    const config = readConfig();
    expect(config.hooks).toEqual({ 'alert-activity': true });
  });

  it('未配置 hooks 段时返回空对象 hooks', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
agents:
  pm:
    workspace: '/pm'
`);
    expect(readConfig().hooks).toEqual({});
  });

  it('无 agents 段时 hooks 段仍然保留', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
hooks:
    alert-activity: true
`);
    const config = readConfig();
    expect(config).toEqual({
      name: 'sess-abc',
      hooks: { 'alert-activity': true }
    });
  });

  it('hooks 段值全部非法时 hooks 为空对象', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
hooks:
    alert-activity: 'yes'
`);
    expect(readConfig().hooks).toEqual({});
  });
});

describe('readConfig logging 解析', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
  });

  it('解析 logging 段的 level 和 file 字段', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
logging:
  level: 'debug'
  file: '/tmp/solo.log'
`);
    const config = readConfig();
    expect(config.logging).toEqual({ level: 'debug', file: '/tmp/solo.log' });
  });

  it('未配置 logging 段时 logging 为 undefined', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
agents:
  pm:
    workspace: '/pm'
`);
    expect(readConfig().logging).toBeUndefined();
  });

  it('logging.level 非字符串时丢弃整个 logging 段', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
logging:
  level: 123
  file: '/tmp/solo.log'
`);
    expect(readConfig().logging).toBeUndefined();
  });

  it('logging.file 非字符串时丢弃整个 logging 段', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
logging:
  level: 'info'
  file: 456
`);
    expect(readConfig().logging).toBeUndefined();
  });

  it('logging 段值全部非法时 logging 为 undefined', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
logging:
  level: 'info'
`);
    expect(readConfig().logging).toBeUndefined();
  });
});

describe('readConfig panes booter 解析', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset();
  });

  it('pane 配置 booter 字段时，正确解析到 AgentPanes', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
agents:
  console:
    workspace: '/workspace'
    activate: true
    panes:
      claude:
        layout: 'left'
        booter: 'claude -c --permission-mode acceptEdits'
`);
    const config = readConfig();
    expect(config.agents?.console?.panes?.claude?.booter).toBe('claude -c --permission-mode acceptEdits');
  });

  it('pane 未配置 booter 时，booter 为 undefined', () => {
    mockReadFileSync.mockReturnValue(`name: 'sess-abc'
agents:
  console:
    workspace: '/workspace'
    activate: true
    panes:
      shell:
        layout: 'right'
`);
    const config = readConfig();
    expect(config.agents?.console?.panes?.shell?.booter).toBeUndefined();
  });
});
