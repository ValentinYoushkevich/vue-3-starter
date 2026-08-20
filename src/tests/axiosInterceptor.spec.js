import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/plugins/axios';
import { useUserStore } from '@/store/user';

/**
 * Тест интерцептора: axios здесь настоящий, подменяется только адаптер —
 * то есть транспорт. Интерцепторы отрабатывают ровно как в проде.
 */
const originalAdapter = axiosInstance.defaults.adapter;

const respond = (config, data) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config
});

const fail = (config, status) =>
  Object.assign(new Error(`Request failed with status ${status}`), {
    config,
    response: { status, data: {}, headers: {}, config }
  });

describe('plugins/axios — обновление токена при 401', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter;
  });

  it('получив 401, обновляет токен и повторяет запрос с новым', async () => {
    const seen = [];
    let profileAttempts = 0;

    axiosInstance.defaults.adapter = async config => {
      seen.push({ url: config.url, auth: config.headers.Authorization });

      if (config.url === '/auth/refresh') {
        return respond(config, { accessToken: 'fresh-token' });
      }

      profileAttempts += 1;

      if (profileAttempts === 1) {
        throw fail(config, 401);
      }

      return respond(config, { id: '1' });
    };

    const store = useUserStore();
    store.setSession({ accessToken: 'stale-token' });

    const { data } = await axiosInstance.get('/users/me');

    expect(data).toEqual({ id: '1' });
    expect(seen.map(call => call.url)).toEqual(['/users/me', '/auth/refresh', '/users/me']);
    expect(seen.at(-1).auth).toBe('Bearer fresh-token');
    expect(store.accessToken).toBe('fresh-token');
  });

  it('на нескольких параллельных 401 уходит ровно один refresh', async () => {
    const refreshCalls = vi.fn();
    const failedOnce = new Set();

    axiosInstance.defaults.adapter = async config => {
      if (config.url === '/auth/refresh') {
        refreshCalls();

        return respond(config, { accessToken: 'fresh-token' });
      }

      if (!failedOnce.has(config.url)) {
        failedOnce.add(config.url);
        throw fail(config, 401);
      }

      return respond(config, { url: config.url });
    };

    useUserStore().setSession({ accessToken: 'stale-token' });

    const results = await Promise.all([
      axiosInstance.get('/orders'),
      axiosInstance.get('/users/me'),
      axiosInstance.get('/settings')
    ]);

    expect(refreshCalls).toHaveBeenCalledTimes(1);
    expect(results.map(response => response.data.url)).toEqual([
      '/orders',
      '/users/me',
      '/settings'
    ]);
  });

  it('если refresh не удался, сессия сбрасывается и ошибка уходит наружу', async () => {
    axiosInstance.defaults.adapter = async config => {
      throw fail(config, 401);
    };

    const store = useUserStore();
    store.setSession({ accessToken: 'stale-token' });

    await expect(axiosInstance.get('/users/me')).rejects.toMatchObject({
      parsed: { status: 401 }
    });
    expect(store.isAuthenticated).toBe(false);
  });

  it('повторяет запрос только один раз, не зацикливаясь', async () => {
    let profileAttempts = 0;

    axiosInstance.defaults.adapter = async config => {
      if (config.url === '/auth/refresh') {
        return respond(config, { accessToken: 'fresh-token' });
      }

      profileAttempts += 1;
      throw fail(config, 401);
    };

    useUserStore().setSession({ accessToken: 'stale-token' });

    await expect(axiosInstance.get('/users/me')).rejects.toBeDefined();
    expect(profileAttempts).toBe(2);
  });
});
