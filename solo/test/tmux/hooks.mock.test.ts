import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExecAsync } = vi.hoisted(() => ({
  mockExecAsync: vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
}));

vi.mock('../../src/tmux/exec', () => ({
  exec: { fn: mockExecAsync }
}));

import { setHook, unsetHook, showHook, isTmuxHook, HOOK_NAMES, registerHooks } from '../../src/tmux/hooks';

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
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('全局设置 hook：拼接 tmux set-hook -g', async () => {
    await setHook('after-new-session', 'run-shell "echo created"');
    expect(mockExecAsync).toHaveBeenCalledWith(
      `tmux set-hook -g after-new-session 'run-shell "echo created"'`
    );
  });

  it('指定 session 设置 hook：拼接 -t sessionName', async () => {
    await setHook('after-split-window', 'run-shell "echo closed"', 'my-session');
    expect(mockExecAsync).toHaveBeenCalledWith(
      `tmux set-hook -t my-session after-split-window 'run-shell "echo closed"'`
    );
  });

  it('command 不含引号时仍用单引号包裹', async () => {
    await setHook('after-kill-pane', 'display-message died');
    expect(mockExecAsync).toHaveBeenCalledWith(
      `tmux set-hook -g after-kill-pane 'display-message died'`
    );
  });

  it('支持 after-* 系列 hook：after-new-session', async () => {
    await setHook('after-new-session', 'run-shell "echo new"');
    expect(mockExecAsync).toHaveBeenCalledWith(
      `tmux set-hook -g after-new-session 'run-shell "echo new"'`
    );
  });
});

describe('unsetHook', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('全局移除 hook：拼接 tmux set-hook -g -u', async () => {
    await unsetHook('after-split-window');
    expect(mockExecAsync).toHaveBeenCalledWith('tmux set-hook -g -u after-split-window');
  });

  it('指定 session 移除 hook：拼接 -t sessionName', async () => {
    await unsetHook('session-closed', 'my-session');
    expect(mockExecAsync).toHaveBeenCalledWith('tmux set-hook -t my-session -u session-closed');
  });
});

describe('showHook', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('全局查看 hook：拼接 tmux show-hooks -g，返回 stdout', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'after-new-session: run-shell "echo"', stderr: '' });
    const result = await showHook('after-new-session');
    expect(mockExecAsync).toHaveBeenCalledWith('tmux show-hooks -g after-new-session');
    expect(result).toBe('after-new-session: run-shell "echo"');
  });

  it('指定 session 查看 hook：拼接 -t sessionName', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    await showHook('after-rename-window', 'sess');
    expect(mockExecAsync).toHaveBeenCalledWith('tmux show-hooks -t sess after-rename-window');
  });
});

describe('registerHooks', () => {
  beforeEach(() => {
    mockExecAsync.mockClear().mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('值为 true 的事件全部注册，返回事件名列表', async () => {
    const registered = await registerHooks('sess-abc', {
      'alert-activity': true,
      'after-send-keys': true,
      'alert-bell': false
    });

    expect(registered).toEqual(['alert-activity', 'after-send-keys']);
    expect(mockExecAsync).toHaveBeenCalledTimes(2);
    // 每个启用事件执行一次 set-hook，回调为 solo hook 上报命令
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      1,
      `tmux set-hook -t sess-abc alert-activity 'run-shell "solo hook --name=alert-activity --session_name=#{session_name} --window_name=#{window_name} --pane_index=#{pane_index}"'`
    );
    expect(mockExecAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('tmux set-hook -t sess-abc after-send-keys')
    );
  });

  it('hooks 为 undefined 或空对象时不执行任何注册', async () => {
    await registerHooks('sess-abc');
    await registerHooks('sess-abc', {});
    expect(mockExecAsync).not.toHaveBeenCalled();
  });

  it('值为 false 的事件跳过注册', async () => {
    await registerHooks('sess-abc', { 'alert-bell': false });
    expect(mockExecAsync).not.toHaveBeenCalled();
  });

  it('配置 tmux 不支持的未知事件名时抛出错误并提示事件名', async () => {
    await expect(registerHooks('sess-abc', { 'pane-created': true })).rejects.toThrow(/pane-created/);
  });
});
