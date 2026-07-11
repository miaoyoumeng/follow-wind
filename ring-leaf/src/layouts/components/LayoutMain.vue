<template>
  <router-view v-slot="{ Component, route }">
    <component :is="Component" v-if="isRouterShow" :key="route.fullPath" />
  </router-view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const isRouterShow = ref(true);
</script>
