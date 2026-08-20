<template>
  <section class="mx-auto mt-24 w-full max-w-sm p-4">
    <h1 class="text-2xl font-semibold">Вход</h1>

    <div class="mt-6 flex flex-col gap-3">
      <label class="flex flex-col gap-1 text-sm" for="email">
        Email
        <input id="email" v-model="email" class="rounded border p-2" type="email">
      </label>

      <label class="flex flex-col gap-1 text-sm" for="password">
        Пароль
        <input id="password" v-model="password" class="rounded border p-2" type="password">
      </label>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

      <button
        class="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
        :disabled="userStore.loading"
        @click="handleSubmit"
      >
        Войти
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ROUTE_NAMES } from '@/constants/routerConstants';
import { useUserStore } from '@/store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const errorMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';
  try {
    await userStore.login({ email: email.value, password: password.value });
    // redirect кладёт guard, когда отправляет неавторизованного юзера сюда
    await router.push(route.query.redirect || { name: ROUTE_NAMES.DASHBOARD });
  } catch (error) {
    errorMessage.value = error.parsed?.message || 'Не удалось войти';
  }
};
</script>
