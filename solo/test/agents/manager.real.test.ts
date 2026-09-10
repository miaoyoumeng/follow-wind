import { describe, it, expect } from 'vitest';
import { isAbsolute, resolve } from 'path';
import { resolveWorkspace } from '../../src/agents/manager';

describe('resolveWorkspace', () => {
  it('绝对路径原样返回', () => {
    expect(resolveWorkspace('/tmp/project')).toBe('/tmp/project');
  });

  it('相对路径基于当前工作目录解析', () => {
    const result = resolveWorkspace('relative/dir');
    expect(isAbsolute(result)).toBe(true);
    expect(result).toBe(resolve(process.cwd(), 'relative/dir'));
  });
});
