import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/logging', () => ({
  logger: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  getLoggingConfig: vi.fn(),
  setup: vi.fn()
}));

import { createNoopProcessor } from '../../../src/hooks/event/noop';
import { createProcessor } from '../../../src/hooks/event/factory';
import type { ClaudeHookEvent } from '../../../src/hooks/event/types';

const ALL_EVENTS: ClaudeHookEvent[] = [
  'SessionStart',
  'SessionEnd',
  'Stop',
  'StopFailure',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'PermissionRequest',
  'PermissionDenied'
];

describe('createNoopProcessor', () => {
  it('返回可安全调用的处理器', async () => {
    const processor = createNoopProcessor('SessionStart');
    expect(processor.process).toBeTypeOf('function');
    await expect(
      processor.process({ session: 's', window: 'w', paneIndex: 0, stdinData: {}, workspace: '' })
    ).resolves.toBeUndefined();
  });
});

describe('createProcessor', () => {
  it('对全部 9 个事件返回可调用的处理器', () => {
    for (const event of ALL_EVENTS) {
      const processor = createProcessor(event);
      expect(processor.process, `event: ${event}`).toBeTypeOf('function');
    }
  });
});
