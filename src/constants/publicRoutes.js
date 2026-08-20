/**
 * Эндпоинты, которые не требуют access-токена.
 * Список читается response-интерцептором: на этих адресах 401 не приводит
 * к попытке обновить сессию, иначе упавший /auth/refresh уходил бы в цикл.
 */
export const PUBLIC_API_ROUTES = ['/auth/login', '/auth/refresh', '/auth/logout'];
