import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { capturePane } from '../../tmux';
import { debug } from '../../logging';

/**
 * 对比当前 pane 内容与已存储的截屏文件
 * - 文件不存在且 saveOnChange 为 true → 保存当前内容为初始快照，返回 { changed: true }
 * - 文件不存在且 saveOnChange 为 false → 返回 { changed: true }（尚无基线）
 * - 内容一致 → 返回 { changed: false }
 * - 内容不一致 → 返回 { changed: true }，saveOnChange 为 true 时覆盖写入文件
 * @param session tmux session 名
 * @param window tmux window 名
 * @param paneIndex pane 索引
 * @param filePath 存储文件路径
 * @param saveOnChange 内容变化或无基线时是否写入文件，默认 false
 */
export const compareWithStored = async (
  session: string,
  window: string,
  paneIndex: number,
  filePath: string,
  saveOnChange = false
): Promise<{ changed: boolean }> => {
  let stored: string | null = null;
  try {
    stored = readFileSync(filePath, 'utf-8');
  } catch {
    // 文件不存在，stored 保持 null
  }

  const current = await capturePane(session, window, paneIndex);

  if (stored === null) {
    debug(`[comparison] no stored file at ${filePath}, saving initial snapshot`);
    if (saveOnChange) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, current);
    }
    return { changed: true };
  }

  if (current === stored) {
    debug(`[comparison] pane content unchanged vs stored file`);
    return { changed: false };
  }

  debug(`[comparison] pane content changed vs stored file`);
  if (saveOnChange) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, current);
  }

  return { changed: true };
};
