import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTokenStore } from '@/renderer/stores/modules/user';

describe('useTokenStore', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('应该正确初始化 state', () => {
    const store = useTokenStore();
    expect(store.token).toBe('');
    expect(store.timestamp).toBe(0);
    expect(store.info).toEqual({
      name: '',
      displayName: '游客',
      roles: [],
      avatar: ''
    });
  });

  it('应该正确返回 tokenUserInfo', () => {
    const store = useTokenStore();
    const mockInfo = {
      name: 'testuser',
      displayName: '测试用户',
      roles: [1, 2],
      avatar: '/avatar.png'
    };
    store.info = mockInfo;
    expect(store.tokenUserInfo).toEqual(mockInfo);
  });

  it('应该正确执行 setToken 操作', () => {
    const store = useTokenStore();
    const mockToken = 'mock-token-123';
    const mockTimestamp = 1234567890;

    store.setToken(mockToken, mockTimestamp);

    expect(store.token).toBe(mockToken);
    expect(store.timestamp).toBe(mockTimestamp);
  });

  it('应该在 setToken 未传入 timestamp 时使用当前时间', () => {
    const store = useTokenStore();
    const mockToken = 'mock-token-456';
    const beforeTime = Date.now();

    store.setToken(mockToken);
    const afterTime = Date.now();

    expect(store.token).toBe(mockToken);
    expect(store.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(store.timestamp).toBeLessThanOrEqual(afterTime);
  });

  it('应该正确执行 setUserInfo 操作', () => {
    const store = useTokenStore();
    const mockInfo = {
      name: 'newuser',
      displayName: '新用户',
      roles: [3],
      avatar: '/new-avatar.png'
    };

    store.setUserInfo(mockInfo);

    expect(store.info).toEqual(mockInfo);
  });

  it('应该正确执行 clear 操作', async () => {
    const store = useTokenStore();

    // 先设置一些值
    store.setToken('test-token', 1234567890);
    store.setUserInfo({
      name: 'test',
      displayName: '测试',
      roles: [1],
      avatar: '/test.png'
    });

    await store.clear();

    expect(store.token).toBeUndefined();
    expect(store.timestamp).toBeUndefined();
    expect(store.info).toBeUndefined();
  });

  it('应该支持完整的用户认证流程', async () => {
    const store = useTokenStore();

    // 1. 设置 token
    store.setToken('auth-token', Date.now());
    expect(store.token).toBe('auth-token');

    // 2. 设置用户信息
    store.setUserInfo({
      name: 'admin',
      displayName: '管理员',
      roles: [1, 2, 3],
      avatar: '/admin.png'
    });
    expect(store?.info?.name).toBe('admin');
    expect(store?.info?.roles).toContain(1);

    // 3. 验证 getter
    expect(store?.tokenUserInfo?.displayName).toBe('管理员');

    // 4. 清除认证
    await store.clear();
    expect(store.token).toBeUndefined();
  });
});
