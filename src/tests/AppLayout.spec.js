import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';

const mountLayout = async breadcrumb => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' }, meta: { breadcrumb } }]
  });

  await router.push('/');
  await router.isReady();

  return mount(AppLayout, { global: { plugins: [router] } });
};

describe('layout/AppLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('рендерит крошку из meta.breadcrumb', async () => {
    const wrapper = await mountLayout(['Раздел', 'Страница']);

    expect(wrapper.find('nav').exists()).toBe(true);
    // у всех пунктов, кроме первого, перед текстом рендерится разделитель
    expect(wrapper.findAll('li').map(item => item.text())).toEqual(['Раздел', '/Страница']);
  });

  it('не рендерит крошку, если meta.breadcrumb не задан', async () => {
    const wrapper = await mountLayout(undefined);

    expect(wrapper.find('nav').exists()).toBe(false);
  });
});
