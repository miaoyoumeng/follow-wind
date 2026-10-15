import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { awaitPaneStop, clearWaits, settleWait } from '../../src/pipe/waiter';

vi.mock('../../src/logging', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('awaitPaneStop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    clearWaits();
    vi.useRealTimers();
  });

  it('settleWait 命中时以 completed 结算', async () => {
    const waiting = awaitPaneStop('s', 'w', 0, 1000);

    expect(settleWait('s', 'w', 0)).toBe(true);
    await expect(waiting).resolves.toBe('completed');
  });

  it('超时后以 timeout 结算，且此后 settle 不再命中', async () => {
    const waiting = awaitPaneStop('s', 'w', 0, 1000);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(waiting).resolves.toBe('timeout');
    expect(settleWait('s', 'w', 0)).toBe(false);
  });

  it('session/window/paneIndex 任一不一致时都不结算', async () => {
    const waiting = awaitPaneStop('s', 'w', 0, 1000);

    expect(settleWait('s', 'w', 1)).toBe(false);
    expect(settleWait('s', 'other', 0)).toBe(false);
    expect(settleWait('other', 'w', 0)).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    await expect(waiting).resolves.toBe('timeout');
  });

  it('客户端断开时以 aborted 结算', async () => {
    let closeListener: (() => void) | undefined;
    const waiting = awaitPaneStop('s', 'w', 0, 1000, {
      onConnectionClose: listener => {
        closeListener = listener;
      }
    });

    closeListener?.();

    await expect(waiting).resolves.toBe('aborted');
  });

  it('正常结算后触发连接关闭，不产生二次结算', async () => {
    let closeListener: (() => void) | undefined;
    const waiting = awaitPaneStop('s', 'w', 0, 1000, {
      onConnectionClose: listener => {
        closeListener = listener;
      }
    });

    settleWait('s', 'w', 0);
    closeListener?.();

    await expect(waiting).resolves.toBe('completed');
  });

  it('同一 pane 重复登记时，旧等待项以 aborted 结算', async () => {
    const first = awaitPaneStop('s', 'w', 0, 1000);
    const second = awaitPaneStop('s', 'w', 0, 1000);

    await expect(first).resolves.toBe('aborted');

    settleWait('s', 'w', 0);
    await expect(second).resolves.toBe('completed');
  });

  it('clearWaits 以 aborted 结算所有等待项', async () => {
    const first = awaitPaneStop('s', 'w', 0, 1000);
    const second = awaitPaneStop('s', 'w', 1, 1000);

    clearWaits();

    await expect(first).resolves.toBe('aborted');
    await expect(second).resolves.toBe('aborted');
    expect(settleWait('s', 'w', 0)).toBe(false);
  });
});
