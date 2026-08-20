# Правила работы с проектом

## Стек

- Vue 3, `<script setup>`, Composition API
- Vite
- Pinia — object syntax (`state` / `getters` / `actions`)
- Vue Router
- Tailwind CSS; sass стоит для SFC со `<style lang="scss">`
- axios
- Vitest + happy-dom
- ESLint + oxlint — зоны разведены через `eslint-plugin-oxlint`

**Не используется. Не добавляй без явной просьбы:**

- TypeScript — проект на чистом JS
- Prettier — форматирование задаётся правилами ESLint и чинится через `npm run lint:fix`
- TanStack Query — см. раздел «Опции»
- PrimeVue или другая UI-библиотека — см. раздел «Опции»
- Отдельный слой `api/` — запросы живут в actions сторов
- Глобальный event bus — см. раздел «Опции»

## Структура

```
src/
  assets/        стили и статика
  components/    общие компоненты, переиспользуемые между страницами
  composables/   общие композаблы
  constants/     константы и enum-объекты
  layout/        каркас приложения (шапка, сайдбар, обёртка страниц)
  pages/         страницы
  plugins/       axios и прочие синглтоны
  router/        роуты и guard
  store/         сторы Pinia
  tests/         тесты
  utils/         чистые функции
    validators/  валидаторы форм
docs/            артефакты проекта: требования, планы, аудиты
```

## Эталоны

Не копируй код из этого файла — смотри рабочие файлы:

| Что пишешь | Эталон |
|---|---|
| Стор | `src/store/user.js` |
| Страницу | `src/pages/AuthPage.vue` |
| Роут и guard | `src/router/index.js` |
| Тест стора | `src/tests/user.spec.js` |
| Тест роутинга | `src/tests/router.spec.js` |
| Тест чистой функции | `src/tests/axiosErrorHandler.spec.js` |
| Тест компонента | `src/tests/AuthPage.spec.js` |
| Тест интерцептора | `src/tests/axiosInterceptor.spec.js` |
| Форму с ошибками по полям | `src/pages/ChangePasswordPage.vue` |
| Работу с API | `src/plugins/axios.js` |

## Конвенции

### Сторы

- Один файл на домен, плоско в `src/store/`. Подпапки не заводим.
- Только object syntax: `state` / `getters` / `actions`. Setup-сторы не используем.
- HTTP-запросы — в `actions`, через `axiosInstance` из `@/plugins/axios`.
- **`useXStore()` вызывается только внутри action или внутри функции.** Никогда на верхнем уровне модуля — на момент импорта Pinia ещё не подключена к приложению, и получишь «no active Pinia».
- Стор может дёргать другой стор для оркестрации, но сначала проверь, не загружены ли данные уже.

### Страницы и компоненты

- Папка называется `pages/`, не `views/`.
- Простая страница — файл `PageName.vue` прямо в `pages/`.
- Страница со своими компонентами — папка: `pages/PageName/PageName.vue` + `pages/PageName/components/`.
- Компонент используется на нескольких страницах — переезжает в `src/components/`.
- Композабл, нужный только внутри одной папки, лежит в ней: `layout/composables/layout.js`. В `src/composables/` — только общие.

### Роутинг

- **Приватно по умолчанию.** Публичный роут помечается явно: `meta: { public: true }`.
- Имена роутов — из `ROUTE_NAMES` в `constants/routerConstants.js`, строкой не хардкодим.
- Все страницы подключаются лениво: `component: () => import('@/pages/...')`.
- `meta.breadcrumb` — массив строк, читается layout'ом.

### API и ошибки

- `baseURL` берётся из `VITE_API_URL`. Домены в код не хардкодим.
- Эндпоинты, не требующие токена, добавляются в `constants/publicRoutes.js`.
- Ошибки разбираются в response-интерцепторе через `axiosErrorHandler`. Результат лежит в `error.parsed`. Не дублируй разбор в каждом сторе.
- Обновление токена реализовано в response-интерцепторе — см. раздел «Авторизация».

### Авторизация

- `accessToken` живёт только в state Pinia; в `localStorage` и `sessionStorage` его класть нельзя — оттуда его читает любой скрипт на странице, то есть достаёт при XSS.
- Refresh-токен лежит в httpOnly-куке, JS его не трогает; у axios включён `withCredentials: true`, без него браузер куку не отправит.
- После перезагрузки страницы сессия восстанавливается через `initAuth()` в `main.js` **до** монтирования приложения — иначе guard отработает на пустом сторе и выкинет залогиненного на `/auth`.
- При 401 интерцептор сам обновляет токен и повторяет запрос один раз; параллельные 401 ждут общий `refreshPromise`. Эндпоинты из `publicRoutes.js` из этой схемы исключены, иначе упавший `/auth/refresh` уходил бы в цикл.
- `mustChangePassword` приходит с логина и рефреша; пока он `true`, guard держит пользователя на `/change-password`.
- Бэкенд возвращает `{ message, errors }`; `axiosErrorHandler` кладёт карту полей в `error.parsed.fields`, компонент подсвечивает конкретные поля формы — см. `pages/ChangePasswordPage.vue`.

### Линтеры

Два линтера с разведёнными зонами. oxlint идёт первым и берёт на себя быстрые базовые правила; `eslint-plugin-oxlint` в конце `eslint.config.js` гасит в ESLint всё, что oxlint уже проверил, поэтому одно правило не срабатывает дважды. ESLint остаётся ответственным за Vue, доступность, sonarjs и безопасность.

**Оба линтера падают на предупреждениях** (`--deny-warnings` / `--max-warnings=0`) — и в `npm run lint`, и в pre-commit. Warning здесь равен ошибке, «потом починю» не проходит.

Что стоит знать до того, как писать код:

- **Порядок блоков в SFC — `template` → `script` → `style`** (`vue/block-order`). Автофиксится.
- **TODO-комментарии запрещены** (`sonarjs/todo-tag`). Незакрытое место описывается словами: что не сделано и от чего зависит.
- **`reactive()` запрещён** — только `ref()`, для тяжёлых объектов `shallowRef()`.
- **В шаблонах нет тернарников и вызовов вида `@click="method()"`** — логика уезжает в `computed`, обработчик передаётся ссылкой.
- **Относительные импорты `.vue` запрещены** — только через алиас `@/`.
- **Каждый тест обязан содержать assertion в своём теле** (`sonarjs/assertions-in-tests`). Проверка, спрятанная в хелпер, правилом не видна.
- **Формы требуют label** (`vuejs-accessibility`) — плейсхолдера недостаточно.
- **У `<style>` с указанным `lang` допустим только `scss`** (`vue/block-lang`); `<style>` без `lang` — обычный CSS. sass в зависимостях есть, компиляция проверена.
- `no-console` и `no-debugger` включаются только при `NODE_ENV=production`: в разработке не мешают, в прод-сборку не попадают.

Правила для Options API — `vue/require-name-property`, `vue/order-in-components`, `vue/match-component-file-name` — из конфига убраны: они срабатывают только на `export default {}`, а весь код на `<script setup>`. Не возвращай их «на всякий случай». `vue/require-prop-types`, `vue/require-default-prop` и `vue/this-in-template`, наоборот, со `<script setup>` работают и оставлены.

Отключённые правила — разобранные ложные срабатывания, а не «шумит, выключим». Не включай обратно и не переписывай код под них:

- `import/no-unassigned-import` — импорт CSS в `main.js` штатен для Vite
- `import/no-named-as-default-member` — `axios.create()` и `axios.CanceledError` это нормальный API
- `promise/prefer-await-to-callbacks` в `plugins/axios.js` — интерцепторы axios принимают только колбэки, подавлено точечно
- `sonarjs/no-hardcoded-passwords`, `sonarjs/parameterized-tests` в тестах — там seed-креды, а не секреты

В `knip.json` расширение `css` держится в `project` намеренно: иначе knip не видит `@import 'tailwindcss'` в `assets/main.css` и объявляет `tailwindcss` неиспользуемой зависимостью.

### Прочее

- Константы и enum-объекты — в `constants/`, не в сторах и не по месту.
- Алиас `@/` указывает на `src/`. Относительные пути глубже одного уровня не используем.
- Артефакты проекта (требования, планы работ, отчёты аудита) кладутся в `docs/`.

## Тесты

- Лежат в `src/tests/`, имя файла — `*.spec.js`.
- Окружение — happy-dom, компоненты монтируются через `@vue/test-utils`.
- Перед каждым тестом стора: `setActivePinia(createPinia())`.
- axios мокается целиком через `vi.mock('@/plugins/axios')`. Сторы и роутер поднимаются настоящие — заглушки только на границе с сетью.
- Guard экспортируется из `router/index.js` отдельно, чтобы тестировать без поднятия приложения.
- Страницы подключаются лениво, поэтому навигация завершается не в текущем тике: результат перехода проверяется через `vi.waitFor`, а не сразу после `flushPromises()`.

## Команды

```bash
npm run dev            # дев-сервер
npm run build          # прод-сборка
npm run preview        # локальный просмотр прод-сборки
npm run lint           # oxlint + eslint
npm run lint:fix       # с автоисправлением
npm run test           # прогон тестов
npm run test:watch     # тесты в watch-режиме
npm run test:ui        # тесты в браузерном UI vitest
npm run finddeadcode   # knip: неиспользуемые файлы, экспорты, зависимости
```

Хуки: `pre-commit` — lint-staged по изменённым файлам, `pre-push` — прогон тестов.

## Опции

Эти вещи в шаблон не входят. Подключай их, только если задача этого требует, и следуй указанным правилам.

### PrimeVue

Ставится вместе с настройкой слоёв Tailwind, иначе стили конфликтуют. В `assets/main.css` порядок каскада задаётся явно, компоненты PrimeVue должны идти до утилит Tailwind. Готовый layout (шапка, сайдбар, меню) в шаблоне отсутствует — берётся из Sakai или пишется руками.

### TypeScript

Проект на JS. Если нужен TS — это отдельное решение по проекту целиком, а не по одному файлу. Смешанный режим не заводим.

### TanStack Query

Нужен, когда в проекте много списков, фильтров, пагинации и инвалидации после мутаций. Если подключаешь — зоны делятся строго:

- TanStack Query — серверное состояние (списки, сущности с бэкенда)
- Pinia — клиентское состояние (юзер, UI, фильтры, корзина)

**`useQuery` внутри стора Pinia не вызывается** — композабл требует setup-контекста компонента. Смешение двух подходов — худший вариант из возможных.

### Event bus

Допустим только для сквозных событий, которые нельзя выразить через props/emit или стор (например, глобальные тосты). Для передачи данных между компонентами не использовать.
