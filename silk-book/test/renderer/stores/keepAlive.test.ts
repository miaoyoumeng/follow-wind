import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/renderer/stores/modules/auth';

// 由于 keepAlive.ts 目前是注释状态
// 这里为 auth store 编写异步边界测试
describe('useAuthStore - 异步边界测试', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('应该处理 fetchData 返回空数据', async () => {
    const store = useAuthStore();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ name: '' })
      } as Response)
    );

    await store.fetchData();
    expect(store.name).toBe('');

    vi.restoreAllMocks();
  });

  it('应该处理 fetchData 返回 null name', async () => {
    const store = useAuthStore();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ name: null })
      } as Response)
    );

    await store.fetchData();
    expect(store.name).toBeNull();

    vi.restoreAllMocks();
  });

  it('应该处理 fetchData 超时', async () => {
    const store = useAuthStore();

    // 使用 vi.fn 模拟一个会超时的 fetch
    // 由于 fetch 返回的 Promise 永远不 resolve，实际应该用 AbortController 处理
    // 这里简单测试网络错误的场景
    global.fetch = vi.fn(() => Promise.reject(new Error('Network timeout')));

    await expect(store.fetchData()).rejects.toThrow('Network timeout');

    vi.restoreAllMocks();
  });

  it('应该在 fetchData 后仍能正常操作', async () => {
    const store = useAuthStore();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ name: 'Updated' })
      } as Response)
    );

    await store.fetchData();
    expect(store.name).toBe('Updated');

    store.increment();
    expect(store.count).toBe(1);
    expect(store.doubleCount).toBe(2);

    vi.restoreAllMocks();
  });
});
