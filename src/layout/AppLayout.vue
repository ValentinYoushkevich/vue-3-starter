<template>
  <div class="min-h-screen">
    <!-- Шапка / сайдбар подключаются здесь под конкретный проект -->
    <nav v-if="breadcrumb.length" class="px-4 pt-4 text-sm text-slate-500" aria-label="breadcrumb">
      <ol class="flex gap-2">
        <li v-for="(item, index) in breadcrumb" :key="item">
          <span v-if="index > 0" class="mr-2">/</span>{{ item }}
        </li>
      </ol>
    </nav>

    <main class="p-4">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';

const route = useRoute();

// meta.breadcrumb — массив строк. Vue Router сливает meta всех matched-записей,
// поэтому крошку можно объявлять и на родительском роуте, и на самой странице.
const breadcrumb = computed(() => route.meta.breadcrumb ?? []);
</script>
