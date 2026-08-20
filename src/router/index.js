import { createRouter, createWebHistory } from 'vue-router';
import { ROUTE_NAMES } from '@/constants/routerConstants';
import AppLayout from '@/layout/AppLayout.vue';
import { useUserStore } from '@/store/user';

/**
 * Правила роутинга:
 * - приватно по умолчанию; публичный роут помечается meta.public: true
 * - все страницы подключаются лениво: () => import(...)
 * - имя роута берётся из ROUTE_NAMES, строкой не хардкодится
 */
export const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: ROUTE_NAMES.DASHBOARD,
        meta: { breadcrumb: ['Dashboard'] },
        component: () => import('@/pages/DashboardPage.vue')
      }
    ]
  },
  {
    path: '/auth',
    name: ROUTE_NAMES.LOGIN,
    meta: { public: true },
    component: () => import('@/pages/AuthPage.vue')
  },
  {
    path: '/change-password',
    name: ROUTE_NAMES.CHANGE_PASSWORD,
    component: () => import('@/pages/ChangePasswordPage.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.NOT_FOUND,
    meta: { public: true },
    component: () => import('@/pages/NotFoundPage.vue')
  }
];

export const authGuard = to => {
  const userStore = useUserStore();
  const isPublic = to.matched.some(record => record.meta.public);

  if (!isPublic && !userStore.isAuthenticated) {
    return { name: ROUTE_NAMES.LOGIN, query: { redirect: to.fullPath } };
  }

  if (to.name === ROUTE_NAMES.LOGIN && userStore.isAuthenticated) {
    return { name: ROUTE_NAMES.DASHBOARD };
  }

  // Временный пароль: пользователь никуда не ходит, пока не сменит его
  if (
    userStore.isAuthenticated &&
    userStore.mustChangePassword &&
    to.name !== ROUTE_NAMES.CHANGE_PASSWORD
  ) {
    return { name: ROUTE_NAMES.CHANGE_PASSWORD };
  }

  return true;
};

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(authGuard);

export default router;
