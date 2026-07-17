<template>
  <component :is="LayoutComponents[layout]" />
</template>
<script setup lang="ts" name="Layout">
import { type Component, computed, ComputedRef } from 'vue';
import LayoutClassic from '@/layouts/classic/index.vue';
import LayoutVertical from '@/layouts/vertical/index.vue';
import { LayoutType } from '@/typings/global';

const LayoutComponents: Record<LayoutType, Component> = {
  classic: LayoutClassic,
  transverse: LayoutVertical,
  vertical: LayoutVertical
};
const layout: ComputedRef<LayoutType> = computed(() => 'classic');
</script>
