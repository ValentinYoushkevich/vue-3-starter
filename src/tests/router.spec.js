import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ROUTE_NAMES } from '@/constants/routerConstants';
import { authGuard, routes } from '@/router';
import { useUserStore } from '@/store/user';

// Эталон теста роутинга: guard экспортируется отдельно,
// поэтому его можно проверить без поднятия приложения.
const createTestRouter = () => {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.beforeEach(authGuard);
  return router;
};

describe('router guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('уводит неавторизованного с приватного роута на логин и запоминает путь', async () => {
    const router = createTestRouter();
    await router.push('/');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN);
    expect(router.currentRoute.value.query.redirect).toBe('/');
  });

  it('пускает авторизованного на приватный роут', async () => {
    useUserStore().setTokens({ accessToken: 'a', refreshToken: 'r' });

    const router = createTestRouter();
    await router.push('/');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.DASHBOARD);
  });

  it('уводит авторизованного со страницы логина на главную', async () => {
    useUserStore().setTokens({ accessToken: 'a', refreshToken: 'r' });

    const router = createTestRouter();
    await router.push('/auth');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.DASHBOARD);
  });

  it('отдаёт NotFound на неизвестный путь', async () => {
    const router = createTestRouter();
    await router.push('/no-such-page');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.NOT_FOUND);
  });
});
