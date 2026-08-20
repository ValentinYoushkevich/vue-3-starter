import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ROUTE_NAMES } from '@/constants/routerConstants';
import { authGuard, routes } from '@/router';
import { useUserStore } from '@/store/user';

vi.mock('@/plugins/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() }
}));

// Эталон теста роутинга: guard экспортируется отдельно,
// поэтому его можно проверить без поднятия приложения.
const createTestRouter = () => {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.beforeEach(authGuard);
  return router;
};

const authenticate = (extra = {}) => {
  const store = useUserStore();
  store.setSession({ accessToken: 'token', ...extra });
  return store;
};

describe('router guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('уводит неавторизованного с приватного роута на логин и запоминает путь', async () => {
    const router = createTestRouter();
    await router.push('/');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN);
    expect(router.currentRoute.value.query.redirect).toBe('/');
  });

  it('пускает авторизованного на приватный роут', async () => {
    authenticate();

    const router = createTestRouter();
    await router.push('/');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.DASHBOARD);
  });

  it('уводит авторизованного со страницы логина на главную', async () => {
    authenticate();

    const router = createTestRouter();
    await router.push('/auth');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.DASHBOARD);
  });

  it('держит на смене пароля, пока пароль временный', async () => {
    authenticate({ mustChangePassword: true });

    const router = createTestRouter();
    await router.push('/');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.CHANGE_PASSWORD);
  });

  it('отдаёт NotFound на неизвестный путь', async () => {
    const router = createTestRouter();
    await router.push('/no-such-page');

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.NOT_FOUND);
  });
});
