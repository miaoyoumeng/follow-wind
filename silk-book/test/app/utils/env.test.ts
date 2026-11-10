import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

describe('Env Utils', () => {
  const envPath = join(rootDir, 'src/app/utils/env.ts');
  const envContent = readFileSync(envPath, 'utf-8');

  it('应该定义 Env 类型', () => {
    expect(envContent).toContain('type Env');
    expect(envContent).toContain('isDev');
    expect(envContent).toContain('isProd');
  });

  it('应该导出 env 对象', () => {
    expect(envContent).toContain('export const env');
  });

  it('应该使用 npm_lifecycle_event 判断环境', () => {
    expect(envContent).toContain('process.env.npm_lifecycle_event');
    expect(envContent).toContain("'dev'");
    expect(envContent).toContain("'production'");
  });
});
