<template>
  <t-layout>
    <t-header style="height: 48px" class="flex-justify-between">
      <Header />
    </t-header>
    <t-content>
      <div class="desktop-apps">
        <t-row :gutter="16">
          <t-col v-for="app in apps" :key="app.appId">
            <div class="app-icon-container" @click="handleAppClick(app.appUrl)">
              <div class="app-icon-border">
                <img class="app-icon" :src="app.appIcon" />
              </div>
              <div class="app-title">{{ app.appName }}</div>
            </div>
          </t-col>
        </t-row>
      </div>
    </t-content>
  </t-layout>
</template>
<script lang="ts" setup name="DesktopApps">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getDesktopApps, App } from '@/api/apps.ts';
import Header from './Header.vue';

const router = useRouter();
// 应用列表数据
const apps = ref<App.AppResp[]>([]);
const listApps = async () => {
  const { data } = await getDesktopApps();
  if (data && data.length > 0) {
    apps.value = data;
  }
};

onMounted(() => {
  listApps();
});

// 处理应用点击事件，进行页面跳转
const handleAppClick = (url: string) => {
  // window.open(url, '_blank');
  router.push(url);
};
</script>

<style scoped>
@import 'index.scss';
</style>
