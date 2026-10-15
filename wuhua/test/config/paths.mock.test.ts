import { describe, it, expect } from 'vitest';
import { join } from 'path';

import { getAgentPromptsDir } from '../../src/config';

describe('getAgentPromptsDir', () => {
  it('返回当前工作目录下 .wuhua/agents/<agent>/prompts 的绝对路径', () => {
    expect(getAgentPromptsDir('console')).toBe(join(process.cwd(), '.wuhua', 'agents', 'console', 'prompts'));
  });

  it('不同 agent 落在互不重叠的目录下', () => {
    expect(getAgentPromptsDir('alpha')).not.toBe(getAgentPromptsDir('beta'));
  });
});
