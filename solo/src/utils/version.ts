import { join } from 'path';
import { readFile } from './files';

/**
 * 从 package.json 读取并返回版本号
 */
export const getVersion = (): string => {
  const pkgPath = join(__dirname, '../../package.json');
  const content = readFile(pkgPath);
  if (!content) {
    throw new Error(`Cannot read package.json at ${pkgPath}`);
  }
  const pkg = JSON.parse(content) as Record<string, unknown>;
  return pkg?.version ? String(pkg.version) : typeof undefined;
};
