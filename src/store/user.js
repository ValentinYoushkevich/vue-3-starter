import { defineStore } from 'pinia';
import axiosInstance from '@/plugins/axios';

/**
 * Эталонный стор. Правила, которые он демонстрирует:
 * - object syntax (state / getters / actions), не setup-стор
 * - запросы живут в actions, отдельного слоя api нет
 * - другие сторы вызываются ВНУТРИ action, а не на верхнем уровне модуля
 *
 * accessToken живёт только в памяти: в localStorage его не кладём, иначе
 * XSS сможет его прочитать. Refresh-токен лежит в httpOnly-куке, JS его не видит.
 * Цена решения: после перезагрузки страницы сессию надо восстановить
 * запросом /auth/refresh — этим занимается initAuth().
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    accessToken: null,
    currentUser: null,
    mustChangePassword: false,
    loading: false,
    // false, пока не отработал initAuth: до этого момента неизвестно,
    // авторизован пользователь или нет, и роутер не должен решать
    authReady: false
  }),

  getters: {
    isAuthenticated: state => Boolean(state.accessToken)
  },

  actions: {
    setSession({ accessToken, mustChangePassword }) {
      this.accessToken = accessToken;
      this.mustChangePassword = Boolean(mustChangePassword);
    },

    clearSession() {
      this.accessToken = null;
      this.currentUser = null;
      this.mustChangePassword = false;
    },

    /**
     * Восстанавливает сессию при старте приложения: если refresh-кука жива,
     * бэкенд вернёт свежий accessToken. Вызывается один раз из main.js
     * до монтирования приложения.
     */
    async initAuth() {
      try {
        const { data } = await axiosInstance.post('/auth/refresh');
        this.setSession(data);
        await this.fetchCurrentUser();
      } catch {
        this.clearSession();
      } finally {
        this.authReady = true;
      }
    },

    /** Обновляет accessToken. Вызывается из интерцептора при 401. */
    async refresh() {
      const { data } = await axiosInstance.post('/auth/refresh');
      this.setSession(data);

      return data.accessToken;
    },

    async login(credentials) {
      this.loading = true;
      try {
        const { data } = await axiosInstance.post('/auth/login', credentials);
        this.setSession(data);
        await this.fetchCurrentUser();

        return data;
      } finally {
        this.loading = false;
      }
    },

    async fetchCurrentUser() {
      const { data } = await axiosInstance.get('/users/me');
      this.currentUser = data;

      return data;
    },

    async changePassword(payload) {
      await axiosInstance.post('/auth/change-password', payload);
      // Бэкенд обрывает все сессии, включая текущую — логинимся заново
      this.clearSession();
    },

    async logout() {
      try {
        await axiosInstance.post('/auth/logout');
      } catch {
        // Запрос мог не дойти — локальную сессию сбрасываем в любом случае,
        // иначе пользователь останется «залогинен» на упавшей сети
      } finally {
        this.clearSession();
      }
    }
  }
});
