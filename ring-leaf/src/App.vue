<template>
  <t-config-provider :global-config="globalConfig">
    <router-view />
  </t-config-provider>
</template>
<script setup lang="ts">
import { GlobalConfigProvider } from 'tdesign-vue-next';

const globalConfig: GlobalConfigProvider = {};
</script>
<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f7f8fa;
  color: #1d2129;
}

:root {
  --td-brand-color: #0052d9;
  --td-brand-color-hover: #003fb3;
  --td-brand-color-active: #0052d9;
  --td-brand-color-focus: #d9e1ff;
}
</style>
