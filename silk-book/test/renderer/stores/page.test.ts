import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/renderer/stores/modules/auth';

// 由于 page.ts 和 keepAlive.ts 目前是注释状态
// 这里先为 auth store 编写额外的边界测试
describe('useAuthStore - 边界测试', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('应该处理 count 为负数的情况', () => {
    const store = useAuthStore();
    store.count = -5;
    expect(store.doubleCount).toBe(-10);

    store.increment();
    expect(store.count).toBe(-4);
  });

  it('应该处理 count 为大数的情况', () => {
    const store = useAuthStore();
    store.count = 1000000;
    expect(store.doubleCount).toBe(2000000);
  });

  it('应该处理空字符串 name', () => {
    const store = useAuthStore();
    store.name = '';
    expect(store.greeting).toBe('Hello from ');
  });

  it('应该处理特殊字符 name', () => {
    const store = useAuthStore();
    store.name = 'Test <script>alert("xss")</script>';
    expect(store.greeting).toBe('Hello from Test <script>alert("xss")</script>');
  });

  it('应该支持多次连续 increment', () => {
    const store = useAuthStore();
    for (let i = 0; i < 100; i++) {
      store.increment();
    }
    expect(store.count).toBe(100);
    expect(store.doubleCount).toBe(200);
  });

  it('应该支持多次连续 decrement', () => {
    const store = useAuthStore();
    store.count = 100;
    for (let i = 0; i < 50; i++) {
      store.decrement();
    }
    expect(store.count).toBe(50);
  });
});
