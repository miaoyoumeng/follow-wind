import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

describe('Platform Utils', () => {
  const platformPath = join(rootDir, 'src/app/utils/platform.ts');
  const platformContent = readFileSync(platformPath, 'utf-8');

  it('应该导入 os 模块', () => {
    expect(platformContent).toContain("import os from 'os'");
  });

  it('应该定义 Platform 类型', () => {
    expect(platformContent).toContain('type Platform');
    expect(platformContent).toContain('isLinux');
    expect(platformContent).toContain('isWin');
    expect(platformContent).toContain('isMac');
  });

  it('应该导出 platform 对象', () => {
    expect(platformContent).toContain('export const platform');
  });

  it('应该使用 os.platform() 检测平台', () => {
    expect(platformContent).toContain('os.platform()');
    expect(platformContent).toContain('darwin');
    expect(platformContent).toContain('win32');
    expect(platformContent).toContain('linux');
  });
});
