<template>
  <section class="p-8">
    <h1 class="text-2xl font-semibold">Страница не найдена</h1>
    <RouterLink class="mt-4 inline-block underline" :to="{ name: ROUTE_NAMES.DASHBOARD }">
      На главную
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { ROUTE_NAMES } from '@/constants/routerConstants';
</script>
