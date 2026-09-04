import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * 从 package.json 读取并返回版本号
 */
export function getVersion(): string {
  const pkgPath = join(__dirname, '../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}
