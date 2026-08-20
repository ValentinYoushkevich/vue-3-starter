import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserStore } from '@/store/user';

// Эталон теста стора: axios мокается целиком, Pinia поднимается заново перед каждым тестом.
vi.mock('@/plugins/axios', () => ({
  default: { post: vi.fn() }
}));

const { default: axiosInstance } = await import('@/plugins/axios');

describe('store/user', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('по умолчанию не авторизован', () => {
    expect(useUserStore().isAuthenticated).toBe(false);
  });

  it('login кладёт токены в стор и в localStorage', async () => {
    axiosInstance.post.mockResolvedValue({
      data: { accessToken: 'a-token', refreshToken: 'r-token' }
    });

    const store = useUserStore();
    await store.login({ email: 'test@example.com', password: 'secret' });

    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('a-token');
  });

  it('logout чистит токены', async () => {
    axiosInstance.post.mockResolvedValue({ data: { accessToken: 'a', refreshToken: 'r' } });

    const store = useUserStore();
    await store.login({});
    store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('сбрасывает loading, даже если запрос упал', async () => {
    axiosInstance.post.mockRejectedValue(new Error('network'));

    const store = useUserStore();
    await expect(store.login({})).rejects.toThrow('network');
    expect(store.loading).toBe(false);
  });
});
