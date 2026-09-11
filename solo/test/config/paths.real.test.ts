import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { PID_FILE_NAME, PID_PATH, SOLO_DIR, paths } from '../../src/config/paths';

describe('PID 路径常量', () => {
  it('PID_FILE_NAME 为 pid', () => {
    expect(PID_FILE_NAME).toBe('pid');
  });

  it('PID_PATH 为 .solo/pid 完整路径', () => {
    expect(PID_PATH).toBe(join(SOLO_DIR, PID_FILE_NAME));
  });

  it('paths 对象包含 pid 和 pidFile 字段', () => {
    expect(paths.pid).toBe(PID_PATH);
    expect(paths.pidFile).toBe(PID_FILE_NAME);
  });
});
