<template>
  <component :is="layoutComponents[layout]" />
</template>
<script setup lang="ts">
defineOptions({ name: 'AppLayout' });
import { type Component, computed, type ComputedRef } from 'vue';
import LayoutClassic from '@/layouts/classic/index.vue';
import LayoutVertical from '@/layouts/vertical/index.vue';
import { type LayoutType } from '@/typings/global';

// .vue 组件在 typescript-eslint 下无法解析类型（需 Volar），此处显式断言
const layoutComponents: Record<LayoutType, Component> = {
  classic: LayoutClassic as Component,
  transverse: LayoutVertical as Component,
  vertical: LayoutVertical as Component
};
const layout: ComputedRef<LayoutType> = computed(() => 'classic');
</script>
