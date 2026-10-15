import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAwaitPaneStop, mockSendKeys, mockSelectPane } = vi.hoisted(() => ({
  mockAwaitPaneStop: vi.fn(),
  mockSendKeys: vi.fn(),
  mockSelectPane: vi.fn()
}));

vi.mock('../../src/pipe/waiter', () => ({
  awaitPaneStop: mockAwaitPaneStop
}));

// tmux 是外部进程边界，mock 以隔离真实命令调用
vi.mock('../../src/tmux', () => ({
  buildPaneKey: (session: string, window: string, paneIndex: number): string => `${session}:${window}.${paneIndex}`,
  selectPane: mockSelectPane,
  sendKeys: mockSendKeys
}));

vi.mock('../../src/logging', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

import { runPromptOnPane } from '../../src/pipe/promptRun';
import { registerRouter, clearAll } from '../../src/task/chatTaskStorage';

describe('runPromptOnPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAll();
    mockSelectPane.mockResolvedValue(undefined);
    mockSendKeys.mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearAll();
  });

  it('未注册 router 时返回 no-router，不提交也不注册等待', async () => {
    const outcome = await runPromptOnPane('s', 'w', 0, 'hi', 1000);

    expect(outcome).toBe('no-router');
    expect(mockSendKeys).not.toHaveBeenCalled();
    expect(mockAwaitPaneStop).not.toHaveBeenCalled();
  });

  it('pane 已被占用时返回 busy，不入队也不提交', async () => {
    const router = registerRouter('s', 'w', 0);
    router.paneStatus.status = 'running';

    const outcome = await runPromptOnPane('s', 'w', 0, 'hi', 1000);

    expect(outcome).toBe('busy');
    expect(router.queue.size()).toBe(0);
    expect(mockSendKeys).not.toHaveBeenCalled();
    expect(mockAwaitPaneStop).not.toHaveBeenCalled();
  });

  it('执行期间保持 running 并暂停 busy 检查，收到 Stop 后归位 idle', async () => {
    const router = registerRouter('s', 'w', 0);
    let statusDuringWait = '';
    mockAwaitPaneStop.mockImplementation(async () => {
      statusDuringWait = router.paneStatus.status;
      return 'completed';
    });

    const outcome = await runPromptOnPane('s', 'w', 0, 'do it', 5000);

    expect(outcome).toBe('completed');
    expect(statusDuringWait).toBe('running');
    expect(router.paneStatus.status).toBe('idle');
    expect(mockSendKeys).toHaveBeenCalledWith('s', 'w', 0, 'do it');
    expect(mockAwaitPaneStop.mock.calls[0].slice(0, 4)).toEqual(['s', 'w', 0, 5000]);
  });

  it('等待超时同样归位 idle', async () => {
    const router = registerRouter('s', 'w', 0);
    mockAwaitPaneStop.mockResolvedValue('timeout');

    const outcome = await runPromptOnPane('s', 'w', 0, 'do it', 5000);

    expect(outcome).toBe('timeout');
    expect(router.paneStatus.status).toBe('idle');
  });

  it('客户端断开导致等待中止时也归位 idle', async () => {
    const router = registerRouter('s', 'w', 0);
    mockAwaitPaneStop.mockResolvedValue('aborted');

    const outcome = await runPromptOnPane('s', 'w', 0, 'do it', 5000);

    expect(outcome).toBe('aborted');
    expect(router.paneStatus.status).toBe('idle');
  });

  it('等待期间被 StopFailure 置为 error 时，收尾不覆盖 error', async () => {
    const router = registerRouter('s', 'w', 0);
    mockAwaitPaneStop.mockImplementation(async () => {
      router.paneStatus.status = 'error';
      return 'timeout';
    });

    const outcome = await runPromptOnPane('s', 'w', 0, 'do it', 5000);

    expect(outcome).toBe('timeout');
    expect(router.paneStatus.status).toBe('error');
  });
});
