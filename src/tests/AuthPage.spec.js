import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ROUTE_NAMES } from '@/constants/routerConstants';
import AuthPage from '@/pages/AuthPage.vue';
import { routes } from '@/router';

// Эталон теста компонента: настоящие Pinia и роутер, замокан только axios.
// Guard намеренно не подключаем — здесь проверяется страница, а не доступ к ней.
vi.mock('@/plugins/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() }
}));

const { default: axiosInstance } = await import('@/plugins/axios');

const mountAuthPage = async (path = '/auth') => {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(path);
  await router.isReady();

  const wrapper = mount(AuthPage, { global: { plugins: [router] } });

  return { wrapper, router };
};

const submit = async wrapper => {
  await wrapper.find('button').trigger('click');
  await flushPromises();
};

describe('pages/AuthPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    axiosInstance.get.mockResolvedValue({ data: { id: '1' } });
  });

  it('отправляет введённые email и пароль в стор', async () => {
    axiosInstance.post.mockResolvedValue({ data: { accessToken: 'a-token' } });

    const { wrapper } = await mountAuthPage();
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('secret');
    await submit(wrapper);

    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'secret'
    });
  });

  it('после успешного входа уводит на Dashboard', async () => {
    axiosInstance.post.mockResolvedValue({ data: { accessToken: 'a-token' } });

    const { wrapper, router } = await mountAuthPage();
    await submit(wrapper);

    // Страницы подключаются лениво, поэтому навигация завершается не в текущем тике.
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.DASHBOARD);
    });
  });

  it('возвращает на путь из query.redirect, который положил guard', async () => {
    axiosInstance.post.mockResolvedValue({ data: { accessToken: 'a-token' } });

    const { wrapper, router } = await mountAuthPage('/auth?redirect=/no-such-page');
    await submit(wrapper);

    await vi.waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/no-such-page');
    });
  });

  it('показывает разобранное интерцептором сообщение об ошибке', async () => {
    axiosInstance.post.mockRejectedValue(
      Object.assign(new Error('request failed'), { parsed: { message: 'Неверный пароль' } })
    );

    const { wrapper } = await mountAuthPage();
    await submit(wrapper);

    expect(wrapper.text()).toContain('Неверный пароль');
  });

  it('подсвечивает конкретные поля из карты ошибок бэкенда', async () => {
    axiosInstance.post.mockRejectedValue(
      Object.assign(new Error('request failed'), {
        parsed: { message: 'Ошибка валидации', fields: { email: 'Пользователь не найден' } }
      })
    );

    const { wrapper } = await mountAuthPage();
    await submit(wrapper);

    expect(wrapper.text()).toContain('Пользователь не найден');
  });

  it('блокирует кнопку, пока запрос в полёте', async () => {
    let resolveLogin;
    axiosInstance.post.mockReturnValue(new Promise(resolve => { resolveLogin = resolve; }));

    const { wrapper } = await mountAuthPage();
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();

    resolveLogin({ data: { accessToken: 'a-token' } });
    await flushPromises();

    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
  });
});
