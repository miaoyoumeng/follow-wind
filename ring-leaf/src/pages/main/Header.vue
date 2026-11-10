<template>
  <div class="header-lf">
    <div class="logo flex-center">
      <img class="logo-img" src="/logo.svg" alt="logo" />
      <span class="logo-text">{{ systemName }}</span>
    </div>
  </div>
  <div class="header-ri flex-center">
    <t-space align="center" :size="20">
      <img class="app-img" style="margin-top: 6px" src="../../assets/images/apps.png" />
      <t-dropdown :options="dropdownOption">
        <t-avatar :image="ssoUserInfo.profilePicture" />
      </t-dropdown>
    </t-space>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Login, logout, storeUserInfo } from '@/api/login.ts';

interface DropdownItem {
  content: string;
  value?: number;
  onClick?: () => void; // 可选属性
}

const systemName = import.meta.env.VITE_GLOB_APP_TITLE as string;

const ssoUserInfo = ref<Login.RespUserInfo>({
  name: '', //账号名称
  displayName: '游客', //显示名称
  roles: [], // 角色
  profilePicture: '' //头像
});

const dropdownOption = ref<DropdownItem[]>([]);
onMounted(() => {
  const userInfo: Login.RespUserInfo = storeUserInfo();
  ssoUserInfo.value = userInfo;
  const userName = userInfo?.displayName ? userInfo?.displayName : '游客';
  dropdownOption.value = [
    { content: userName, value: 1 },
    { content: '退出', onClick: () => logout() }
  ];
});
</script>
<style scoped>
.header-lf {
  overflow: hidden;
  white-space: nowrap;

  .logo {
    flex-shrink: 0;
    width: 210px;
    margin-right: 16px;
    .logo-img {
      width: 28px;
      object-fit: contain;
      margin-right: 6px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: bold;
      color: #303133;
      white-space: nowrap;
    }
  }
}

.header-ri {
  overflow: hidden;
  white-space: nowrap;
  width: 200px;
  .app-img {
    width: 24px;
    margin: auto;
  }
}
</style>
