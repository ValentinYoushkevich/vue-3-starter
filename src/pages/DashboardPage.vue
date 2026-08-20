<template>
  <section>
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p v-if="userStore.currentUser" class="mt-2 text-slate-600">
      {{ userStore.currentUser.firstName }} {{ userStore.currentUser.lastName }}
    </p>
    <button class="mt-4 rounded bg-slate-800 px-4 py-2 text-white" @click="userStore.logout">
      Выйти
    </button>
  </section>
</template>

<script setup>
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
</script>
