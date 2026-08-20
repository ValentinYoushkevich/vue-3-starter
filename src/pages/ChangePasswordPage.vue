<template>
  <section class="mx-auto mt-24 w-full max-w-sm p-4">
    <h1 class="text-2xl font-semibold">Смена пароля</h1>
    <p class="mt-2 text-sm text-slate-600">
      Пароль временный — задайте постоянный, чтобы продолжить.
    </p>

    <div class="mt-6 flex flex-col gap-3">
      <div>
        <label class="flex flex-col gap-1 text-sm" for="currentPassword">
          Текущий пароль
          <input
            id="currentPassword"
            v-model="currentPassword"
            class="w-full rounded border p-2"
            type="password"
          >
        </label>
        <p v-if="fieldErrors.currentPassword" class="mt-1 text-sm text-red-600">
          {{ fieldErrors.currentPassword }}
        </p>
      </div>

      <div>
        <label class="flex flex-col gap-1 text-sm" for="newPassword">
          Новый пароль
          <input
            id="newPassword"
            v-model="newPassword"
            class="w-full rounded border p-2"
            type="password"
          >
        </label>
        <p v-if="fieldErrors.newPassword" class="mt-1 text-sm text-red-600">
          {{ fieldErrors.newPassword }}
        </p>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

      <button
        class="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
        @click="handleSubmit"
      >
        Сохранить
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ROUTE_NAMES } from '@/constants/routerConstants';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const currentPassword = ref('');
const newPassword = ref('');
const errorMessage = ref('');
// Карта ошибок с бэкенда: { newPassword: 'At least one digit is required' }
const fieldErrors = ref({});

const handleSubmit = async () => {
  errorMessage.value = '';
  fieldErrors.value = {};

  try {
    await userStore.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    });
    await router.push({ name: ROUTE_NAMES.LOGIN });
  } catch (error) {
    errorMessage.value = error.parsed?.message || 'Не удалось сменить пароль';
    fieldErrors.value = error.parsed?.fields || {};
  }
};
</script>
