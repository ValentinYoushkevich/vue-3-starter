/**
 * Единая точка разбора ошибок API.
 * Вызывается из response-интерцептора, а не из каждого стора.
 * @param {unknown} error
 * @returns {{ status: number|null, message: string, fields: Record<string, string> }}
 */
export const axiosErrorHandler = error => {
  if (error?.code === 'ERR_CANCELED') {
    return { status: null, message: 'Запрос отменён', fields: {} };
  }

  if (!error?.response) {
    return { status: null, message: 'Нет связи с сервером', fields: {} };
  }

  const { status, data } = error.response;

  const messageByStatus = {
    400: 'Некорректный запрос',
    401: 'Требуется авторизация',
    403: 'Недостаточно прав',
    404: 'Не найдено',
    409: 'Конфликт данных',
    422: 'Ошибка валидации',
    500: 'Ошибка сервера'
  };

  return {
    status,
    message: data?.message || messageByStatus[status] || 'Неизвестная ошибка',
    fields: data?.errors || {}
  };
};
