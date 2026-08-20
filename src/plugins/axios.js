import axios from 'axios';
import { PUBLIC_API_ROUTES } from '@/constants/publicRoutes';
import { useUserStore } from '@/store/user';
import { axiosErrorHandler } from '@/utils/axiosErrorHandler';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

axiosInstance.interceptors.request.use(async config => {
  if (PUBLIC_API_ROUTES.includes(config.url)) {
    return config;
  }

  let needToCancel = false;

  // useUserStore() вызывается здесь, а не на верхнем уровне модуля:
  // на момент импорта Pinia ещё не подключена к приложению.
  const userStore = useUserStore();

  await userStore.checkAuthTokens({
    cancelRequests: () => {
      needToCancel = true;
    }
  });

  if (needToCancel) {
    throw new axios.CanceledError('Auth failure');
  }

  config.headers.Authorization = `Bearer ${userStore.accessToken}`;

  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  // Интерцепторы axios принимают только колбэки, переписать на await нечего.
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  error => {
    const parsed = axiosErrorHandler(error);

    if (parsed.status === 401) {
      useUserStore().logout();
    }

    return Promise.reject(Object.assign(error, { parsed }));
  }
);

export default axiosInstance;
