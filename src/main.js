import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import { useUserStore } from '@/store/user';
import '@/assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Сессию восстанавливаем ДО монтирования: иначе guard успеет отработать
// на пустом сторе и выкинет залогиненного пользователя на /auth.
// initAuth() гасит ошибку внутри себя, поэтому отдельный catch тут не нужен.
const userStore = useUserStore(pinia);

await userStore.initAuth();

app.use(router);
app.mount('#app');
