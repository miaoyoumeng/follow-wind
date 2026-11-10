import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/renderer/stores/modules/auth';

describe('useAuthStore', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('应该正确初始化 state', () => {
    const store = useAuthStore();
    expect(store.count).toBe(0);
    expect(store.name).toBe('Pinia Store');
  });

  it('应该正确计算 doubleCount', () => {
    const store = useAuthStore();
    store.count = 5;
    expect(store.doubleCount).toBe(10);
  });

  it('应该正确计算 greeting', () => {
    const store = useAuthStore();
    store.name = 'Test User';
    expect(store.greeting).toBe('Hello from Test User');
  });

  it('应该正确执行 increment 操作', () => {
    const store = useAuthStore();
    store.increment();
    expect(store.count).toBe(1);

    store.increment();
    expect(store.count).toBe(2);
  });

  it('应该正确执行 decrement 操作', () => {
    const store = useAuthStore();
    store.count = 5;
    store.decrement();
    expect(store.count).toBe(4);
  });

  it('应该正确执行 fetchData 异步操作', async () => {
    const store = useAuthStore();

    // Mock fetch
    const mockData = { name: 'Fetched Name' };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockData)
      } as Response)
    );

    await store.fetchData();

    expect(store.name).toBe('Fetched Name');
    expect(global.fetch).toHaveBeenCalledWith('/api/data');

    // 清理
    vi.restoreAllMocks();
  });

  it('应该在 fetchData 失败时抛出错误', async () => {
    const store = useAuthStore();

    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    await expect(store.fetchData()).rejects.toThrow('Network error');

    vi.restoreAllMocks();
  });
});
