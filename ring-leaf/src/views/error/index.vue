<!-- 经典布局 -->
<template>
  <div style="height: 100%">
    <t-layout style="height: 100%">
      <t-layout>
        <t-content>
          <component :is="LayoutErrorComponents[layout]" />
        </t-content>
      </t-layout>
    </t-layout>
  </div>
</template>
<script setup lang="ts" name="404">
import { computed, type Component } from 'vue';
import { useRoute } from 'vue-router';

import Layout400 from '@/components/ErrorMessage/400.vue';
import Layout403 from '@/components/ErrorMessage/403.vue';
import Layout404 from '@/components/ErrorMessage/404.vue';
import Layout500 from '@/components/ErrorMessage/500.vue';

type LayoutType = '/400' | '/403' | '/404' | '/500';
const LayoutErrorComponents: Record<LayoutType, Component> = {
  '/400': Layout400,
  '/403': Layout403,
  '/404': Layout404,
  '/500': Layout500
};

function getLayoutType(value: string): LayoutType {
  const validTypes: LayoutType[] = ['/400', '/403', '/404', '/500'];
  if (validTypes.includes(value as LayoutType)) {
    return value as LayoutType;
  }
  return '/404' as LayoutType;
}
// 获取当前页面的路径
const layout = computed(() => {
  const route = useRoute();
  return getLayoutType(route.path);
});
</script>
