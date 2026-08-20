/**
 * Эндпоинты, которые не требуют access-токена.
 * Для них axios не дёргает проверку/обновление токенов.
 */
export const PUBLIC_API_ROUTES = [
  '/auth/login',
  '/auth/refresh-token',
  '/auth/forgot-password'
];
