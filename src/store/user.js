import { defineStore } from 'pinia';
import axiosInstance from '@/plugins/axios';
import { authTokensStorage } from '@/utils/authTokensStorage';

/**
 * Эталонный стор. Правила, которые он демонстрирует:
 * - object syntax (state / getters / actions), не setup-стор
 * - запросы живут в actions, отдельного слоя api нет
 * - другие сторы вызываются ВНУТРИ action, а не на верхнем уровне модуля
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    accessToken: authTokensStorage.getAccessToken(),
    refreshToken: authTokensStorage.getRefreshToken(),
    currentUser: null,
    loading: false
  }),

  getters: {
    isAuthenticated: state => Boolean(state.accessToken)
  },

  actions: {
    setTokens({ accessToken, refreshToken }) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      authTokensStorage.save({ accessToken, refreshToken });
    },

    clearTokens() {
      this.accessToken = null;
      this.refreshToken = null;
      this.currentUser = null;
      authTokensStorage.clear();
    },

    /**
     * Вызывается из request-интерцептора перед каждым приватным запросом.
     * cancelRequests() отменяет исходный запрос, если авторизацию восстановить не удалось.
     *
     * Точка расширения: срок жизни accessToken здесь не проверяется и refresh не вызывается —
     * схема обновления зависит от бэкенда и дописывается в проекте. Логику держим тут,
     * в интерцептор её не растаскиваем.
     */
    async checkAuthTokens({ cancelRequests } = {}) {
      if (!this.accessToken) {
        cancelRequests?.();
      }
    },

    async login(credentials) {
      this.loading = true;
      try {
        const { data } = await axiosInstance.post('/auth/login', credentials);
        this.setTokens(data);
        return data;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.clearTokens();
    }
  }
});
