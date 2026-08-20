# Vue 3 Starter

Каркас фронтенда: Vue 3 + Pinia + Vue Router + Tailwind + axios, с настроенным линтом, тестами и правилами для AI-агента.

## Старт нового проекта

Требуется **Node.js 22.22.1 или новее** — версия зафиксирована в `engines`.

```bash
npx degit ValentinYoushkevich/vue3-starter my-app
cd my-app

npx npm-check-updates -u   # подтянуть свежие мажоры
npm install

cp .env.example .env       # прописать VITE_API_URL
git init && git add . && git commit -m "init"

npm run dev
```

## Что поправить сразу

1. `name` в `package.json`
2. `VITE_API_URL` в `.env`
3. Эндпоинты авторизации в `src/constants/publicRoutes.js` — под свой бэкенд
4. Контракт `login` в `src/store/user.js` — под формат ответа своего API
5. Обновление токена — `checkAuthTokens` в `src/store/user.js` пока только отменяет запрос без токена, схема обновления зависит от бэкенда

## Что внутри

- **Приватный роутинг по умолчанию** — публичный роут помечается `meta: { public: true }`, guard работает в обе стороны
- **axios** с baseURL из env, проверкой токенов в request-интерцепторе и разбором ошибок в response
- **Стор пользователя** с токенами в localStorage; обновление токена — точка расширения под свой бэкенд
- **19 тестов** на guard, стор, обработчик ошибок, страницу и layout — эталоны для дальнейших
- **Два линтера с разведёнными зонами** — oxlint для базовых правил, ESLint для Vue, доступности, sonarjs и безопасности; оба падают на предупреждениях
- **Хуки**: pre-commit — lint-staged, pre-push — тесты
- **`.cursor/settings.json` и `.claude/settings.json`** — запрет чтения `.env` и ключей для агентов
- **`CLAUDE.md`** — правила и указатели на эталонные файлы

## Чего внутри нет

TypeScript, Prettier, PrimeVue, TanStack Query, event bus, готовый layout со стилями. Каждое — осознанное решение, причины и порядок подключения описаны в `CLAUDE.md`, раздел «Опции».

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | дев-сервер |
| `npm run build` | прод-сборка |
| `npm run preview` | локальный просмотр прод-сборки |
| `npm run lint` | oxlint + eslint |
| `npm run lint:fix` | то же с автоисправлением |
| `npm run test` | прогон тестов |
| `npm run test:watch` | тесты в watch-режиме |
| `npm run test:ui` | тесты в браузерном UI vitest |
| `npm run finddeadcode` | knip: мёртвый код и лишние зависимости |
