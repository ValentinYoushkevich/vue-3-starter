import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserStore } from '@/store/user';

// Эталон теста стора: axios мокается целиком, Pinia поднимается заново перед каждым тестом.
vi.mock('@/plugins/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() }
}));

const { default: axiosInstance } = await import('@/plugins/axios');

describe('store/user', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('по умолчанию не авторизован', () => {
    expect(useUserStore().isAuthenticated).toBe(false);
  });

  it('login кладёт accessToken в стор и подтягивает профиль', async () => {
    axiosInstance.post.mockResolvedValue({ data: { accessToken: 'a-token' } });
    axiosInstance.get.mockResolvedValue({ data: { id: '1', email: 'user@example.com' } });

    const store = useUserStore();
    await store.login({ email: 'user@example.com', password: 'secret' });

    expect(store.isAuthenticated).toBe(true);
    expect(store.currentUser?.email).toBe('user@example.com');
  });

  it('не сохраняет токен в localStorage', async () => {
    axiosInstance.post.mockResolvedValue({ data: { accessToken: 'a-token' } });
    axiosInstance.get.mockResolvedValue({ data: {} });

    await useUserStore().login({});

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it('initAuth восстанавливает сессию по refresh-куке', async () => {
    axiosInstance.post.mockResolvedValue({ data: { accessToken: 'restored' } });
    axiosInstance.get.mockResolvedValue({ data: { id: '1' } });

    const store = useUserStore();
    await store.initAuth();

    expect(store.isAuthenticated).toBe(true);
    expect(store.authReady).toBe(true);
  });

  it('initAuth без валидной куки оставляет гостя, но помечает готовность', async () => {
    axiosInstance.post.mockRejectedValue(new Error('401'));

    const store = useUserStore();
    await store.initAuth();

    expect(store.isAuthenticated).toBe(false);
    expect(store.authReady).toBe(true);
  });

  it('logout чистит сессию даже если запрос упал', async () => {
    axiosInstance.post.mockResolvedValueOnce({ data: { accessToken: 'a-token' } });
    axiosInstance.get.mockResolvedValue({ data: {} });
    const store = useUserStore();
    await store.login({});

    axiosInstance.post.mockRejectedValueOnce(new Error('network'));
    await store.logout();

    expect(store.isAuthenticated).toBe(false);
  });

  it('сбрасывает loading, даже если логин упал', async () => {
    axiosInstance.post.mockRejectedValue(new Error('network'));

    const store = useUserStore();
    await expect(store.login({})).rejects.toThrow('network');
    expect(store.loading).toBe(false);
  });

  it('mustChangePassword прокидывается из ответа', async () => {
    axiosInstance.post.mockResolvedValue({
      data: { accessToken: 'a-token', mustChangePassword: true }
    });
    axiosInstance.get.mockResolvedValue({ data: {} });

    const store = useUserStore();
    await store.login({});

    expect(store.mustChangePassword).toBe(true);
  });
});
