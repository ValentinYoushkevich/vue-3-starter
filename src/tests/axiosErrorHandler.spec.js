import { describe, expect, it } from 'vitest';
import { axiosErrorHandler } from '@/utils/axiosErrorHandler';

// Эталон теста чистой функции: без моков, только вход/выход.
describe('axiosErrorHandler', () => {
  it('распознаёт отменённый запрос', () => {
    expect(axiosErrorHandler({ code: 'ERR_CANCELED' }).message).toBe('Запрос отменён');
  });

  it('распознаёт отсутствие связи', () => {
    expect(axiosErrorHandler(new Error('boom')).status).toBeNull();
  });

  it('берёт сообщение с бэкенда, если оно есть', () => {
    const error = { response: { status: 422, data: { message: 'Email занят' } } };
    expect(axiosErrorHandler(error)).toMatchObject({ status: 422, message: 'Email занят' });
  });

  it('падает на дефолтное сообщение по статусу', () => {
    const error = { response: { status: 403, data: {} } };
    expect(axiosErrorHandler(error).message).toBe('Недостаточно прав');
  });
});
