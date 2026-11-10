import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

describe('App Store', () => {
  const storePath = join(rootDir, 'src/app/store/index.ts');
  const storeContent = readFileSync(storePath, 'utf-8');

  it('应该导入 electron-store', () => {
    expect(storeContent).toContain("import Store from 'electron-store'");
  });

  it('应该导出 store 实例', () => {
    expect(storeContent).toContain('export const store');
  });

  it('应该创建名为 silk-book 的 store', () => {
    expect(storeContent).toContain("name: 'silk-book'");
  });

  it('应该使用 new Store 创建实例', () => {
    expect(storeContent).toContain('new Store');
  });
});
