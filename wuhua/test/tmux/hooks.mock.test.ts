import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExeca } = vi.hoisted(() => ({
  mockExeca: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

vi.mock('execa', () => ({
  execa: mockExeca
}));

import { setHook, isTmuxHook, HOOK_NAMES, registerHooks } from '../../src/tmux/hooks';

describe('isTmuxHook', () => {
  it('HOOK_NAMES 中的每个名字都被识别为合法 hook', () => {
    for (const name of HOOK_NAMES) {
      expect(isTmuxHook(name)).toBe(true);
    }
  });

  it('非法 hook 名（拼写错误/臆造）返回 false', () => {
    expect(isTmuxHook('pane-created')).toBe(false);
    expect(isTmuxHook('alert-ativty')).toBe(false);
    expect(isTmuxHook('')).toBe(false);
  });
});

describe('setHook', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('全局设置 hook：scope 参数为 -g', async () => {
    await setHook('after-new-session', 'run-shell "echo created"');
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['set-hook', '-g', 'after-new-session', 'run-shell "echo created"']);
  });

  it('指定 session 设置 hook：scope 参数为 -t sessionName', async () => {
    await setHook('after-split-window', 'run-shell "echo closed"', 'my-session');
    expect(mockExeca).toHaveBeenCalledWith('tmux', [
      'set-hook',
      '-t',
      'my-session',
      'after-split-window',
      'run-shell "echo closed"'
    ]);
  });

  it('command 含空格时作为单个参数原样传递，不做 shell 引号包裹', async () => {
    await setHook('after-kill-pane', 'display-message died');
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['set-hook', '-g', 'after-kill-pane', 'display-message died']);
  });

  it('支持 after-* 系列 hook：after-new-session', async () => {
    await setHook('after-new-session', 'run-shell "echo new"');
    expect(mockExeca).toHaveBeenCalledWith('tmux', ['set-hook', '-g', 'after-new-session', 'run-shell "echo new"']);
  });
});

describe('registerHooks', () => {
  beforeEach(() => {
    mockExeca.mockReset().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('值为 true 的事件全部注册，返回事件名列表', async () => {
    const registered = await registerHooks('sess-abc', {
      'alert-activity': true,
      'after-send-keys': true,
      'alert-bell': false
    });

    expect(registered).toEqual(['alert-activity', 'after-send-keys']);
    expect(mockExeca).toHaveBeenCalledTimes(2);
    // 每个启用事件执行一次 set-hook，回调为 wuhua hook 上报命令
    expect(mockExeca).toHaveBeenNthCalledWith(1, 'tmux', [
      'set-hook',
      '-t',
      'sess-abc',
      'alert-activity',
      'run-shell "wuhua hook --endpoint=tmux --event=alert-activity"'
    ]);
    expect(mockExeca).toHaveBeenNthCalledWith(2, 'tmux', [
      'set-hook',
      '-t',
      'sess-abc',
      'after-send-keys',
      'run-shell "wuhua hook --endpoint=tmux --event=after-send-keys"'
    ]);
  });

  it('hooks 为 undefined 或空对象时不执行任何注册', async () => {
    await registerHooks('sess-abc');
    await registerHooks('sess-abc', {});
    expect(mockExeca).not.toHaveBeenCalled();
  });

  it('值为 false 的事件跳过注册', async () => {
    await registerHooks('sess-abc', { 'alert-bell': false });
    expect(mockExeca).not.toHaveBeenCalled();
  });

  it('配置 tmux 不支持的未知事件名时抛出错误并提示事件名', async () => {
    await expect(registerHooks('sess-abc', { 'pane-created': true })).rejects.toThrow(/pane-created/);
  });
});
