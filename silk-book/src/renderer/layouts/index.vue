<template>
  <t-layout class="layout">
    <!-- 左侧菜单栏 -->
    <t-aside class="sidebar">
      <div class="menu-container">
        <!-- 上半部分：功能菜单 -->
        <div class="menu-section menu-section-top">
          <MenuItem
            :text="t('layout.menu.home')"
            icon-name="home"
            :icon-width="48"
            :icon-height="32"
            :is-active="activeMenu === 'home'"
            path="/"
            @click="handleMenuClick"
          />
          <MenuItem
            :text="t('layout.menu.markdown')"
            :svg-content="markdownSvg"
            :icon-width="48"
            :icon-height="32"
            :is-active="activeMenu === 'markdown'"
            path="/gitbook"
            @click="handleMenuClick"
          />
        </div>

        <!-- 下半部分：个人菜单 -->
        <div class="menu-section menu-section-bottom">
          <!-- 顶部分割线 -->
          <div class="menu-divider menu-divider-top"></div>
          <MenuItem
            :text="t('layout.menu.mine')"
            icon-name="user"
            :is-active="activeMenu === 'mine'"
            path="/mine"
            @click="handleMenuClick"
          />
          <MenuItem
            :text="t('layout.menu.skin')"
            icon-name="palette"
            :is-active="activeMenu === 'skin'"
            path="/skin"
            @click="handleMenuClick"
          />
          <MenuItem
            :text="t('layout.menu.settings')"
            icon-name="setting"
            :is-active="activeMenu === 'settings'"
            path="/settings"
            @click="handleMenuClick"
          />
          <!-- 底部分割线 -->
          <div class="menu-divider menu-divider-bottom"></div>
        </div>
      </div>
    </t-aside>

    <!-- 右侧内容区 -->
    <t-layout>
      <t-content class="content">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import markdownSvg from '@/assets/icons/markdown.svg?raw';
import MenuItem from '@/renderer/components/MenuItem';

const router = useRouter();
const { t } = useI18n();
const activeMenu = ref<string>('home');

// 处理菜单点击
const handleMenuClick = (path: string): void => {
  router.push(path);
};
onMounted(async () => {
  const gitbook = await window.electronStore.get('gitbook');
  const path = gitbook?.path;
  console.log('path = ' + path);
});
</script>

<style lang="scss" scoped>
.sidebar {
  width: 70px;
  background-color: #fff;
  border-right: 1px solid #e7e7e7;
  display: flex;
  flex-direction: column;
}

.layout {
  width: 100%;
  height: 100%;
}

.menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 8px;
  justify-content: space-between;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px;
}

.menu-section-top {
  padding-bottom: 0;
}

.menu-section-bottom {
  padding: 0 8px;
}

.menu-divider {
  height: 1px;
  background-color: #e7e7e7;
  margin: 8px 8px;
}

.menu-divider-top {
  margin-bottom: 8px;
}

.menu-divider-bottom {
  margin-top: 8px;
}
</style>
