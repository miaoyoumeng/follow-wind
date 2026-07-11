<template>
  <t-config-provider :global-config="globalConfig">
    <router-view />
  </t-config-provider>
</template>
<script setup lang="ts">
import { GlobalConfigProvider } from 'tdesign-vue-next';

const globalConfig: GlobalConfigProvider = {};
</script>
