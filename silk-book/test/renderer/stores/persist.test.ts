import { describe, it, expect } from 'vitest';
import piniaPersistConfig from '@/renderer/stores/config/persist';

describe('piniaPersistConfig', () => {
  it('应该返回正确的配置对象', () => {
    const config = piniaPersistConfig('test-key');

    expect(config).toEqual({
      key: 'test-key',
      storage: localStorage,
      pick: undefined,
      debug: true
    });
  });

  it('应该支持传入 paths 参数', () => {
    const config = piniaPersistConfig('test-key', ['name', 'count']);

    expect(config.key).toBe('test-key');
    expect(config.pick).toEqual(['name', 'count']);
    expect(config.storage).toBe(localStorage);
    expect(config.debug).toBe(true);
  });

  it('应该使用 localStorage 作为存储', () => {
    const config = piniaPersistConfig('test-key');
    expect(config.storage).toBe(localStorage);
  });

  it('应该设置 debug 为 true', () => {
    const config = piniaPersistConfig('test-key');
    expect(config.debug).toBe(true);
  });

  it('应该为不同的 key 返回不同的配置', () => {
    const config1 = piniaPersistConfig('key1');
    const config2 = piniaPersistConfig('key2');

    expect(config1.key).toBe('key1');
    expect(config2.key).toBe('key2');
  });

  it('应该支持空 paths 数组', () => {
    const config = piniaPersistConfig('test-key', []);
    expect(config.pick).toEqual([]);
  });

  it('应该支持单个 path', () => {
    const config = piniaPersistConfig('test-key', ['token']);
    expect(config.pick).toEqual(['token']);
  });
});
