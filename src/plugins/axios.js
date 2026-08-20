import axios from 'axios';
import { PUBLIC_API_ROUTES } from '@/constants/publicRoutes';
import { useUserStore } from '@/store/user';
import { axiosErrorHandler } from '@/utils/axiosErrorHandler';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Обязательно: без этого браузер не отправит httpOnly-куку с refresh-токеном
  withCredentials: true
});

axiosInstance.interceptors.request.use(config => {
  // useUserStore() вызывается здесь, а не на верхнем уровне модуля:
  // на момент импорта Pinia ещё не подключена к приложению.
  const userStore = useUserStore();

  if (userStore.accessToken) {
    config.headers.Authorization = `Bearer ${userStore.accessToken}`;
  }

  return config;
});

// Общий промис обновления: если 401 прилетел сразу по нескольким запросам,
// refresh уходит один раз, остальные ждут его результата.
let refreshPromise = null;

axiosInstance.interceptors.response.use(
  response => response,
  // Интерцепторы axios принимают только колбэки, переписать на await нечего.
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  async error => {
    const parsed = axiosErrorHandler(error);
    const originalRequest = error.config;
    const userStore = useUserStore();

    const canRetry =
      parsed.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !PUBLIC_API_ROUTES.includes(originalRequest.url);

    if (canRetry) {
      originalRequest._retried = true;

      try {
        refreshPromise = refreshPromise ?? userStore.refresh();
        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return await axiosInstance(originalRequest);
      } catch {
        userStore.clearSession();
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(Object.assign(error, { parsed }));
  }
);

export default axiosInstance;
