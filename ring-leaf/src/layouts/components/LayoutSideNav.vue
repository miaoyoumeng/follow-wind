<template>
  <div style="height: var(--td-comp-size-xxxl)" class="flex-center">
    <span class="side-nav-logo-wrapper flex-left-center">
      <div class="side-nav-logo flex-left-center">
        <img src="@/assets/images/paddy.png" class="logo-img" />
      </div>
      <span v-if="!props.menuCollapsed" class="ml8 text-center font-size-22 font-weight-600 flex-left-center">{{ title }}</span>
    </span>
  </div>
  <div>
    <t-menu @change="handleNavTo" :collapsed="props.menuCollapsed">
      <template v-for="menu in menus" :key="menu.id">
        <!-- 如果是子菜单 -->
        <t-submenu v-if="menu.children && menu.children.length > 0" :value="menu.path">
          <template #title>{{ menu.meta?.title }}</template>
          <template #icon>
            <t-icon :name="menu.meta?.icon" />
          </template>
          <t-menu-item v-for="child in menu.children" :key="child.id" :value="child.path">
            <template #icon>
              <t-icon :name="child.meta?.icon" />
            </template>
            {{ child.meta?.title }}
          </t-menu-item>
        </t-submenu>
        <!-- 如果是普通菜单项 -->
        <t-menu-item v-else :value="menu.path">
          <template #icon>
            <t-icon :name="menu.meta?.icon" />
          </template>
          {{ menu.meta?.title }}
        </t-menu-item>
      </template>
    </t-menu>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { MenuProps, MenuValue } from 'tdesign-vue-next';
interface Props {
  menuCollapsed: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  menuCollapsed: false //左侧菜单是否收缩
});

const title = import.meta.env.VITE_GLOB_APP_TITLE as string;

const router = useRouter();

import { getAppMenus } from '@/api/menu.ts';
import { Menu } from '@/api/modules/auth.ts';

const menus = ref<Menu.MenuOptions[]>([]);

watch(props, () => {
  console.log('nav watch....');
});

onMounted(() => {
  renderMenus();
});

//functions
const renderMenus = async () => {
  const { data } = await getAppMenus();
  if (data && data.length > 0) {
    menus.value = data;
  }
};
const handleNavTo: MenuProps['onChange'] = (item: MenuValue) => {
  const routePath = item as string;
  router.push(routePath);
};
</script>
<style scoped>
.logo-img {
  height: 32px;
  width: 32px;
}
.side-nav-logo-wrapper {
  padding: 0 0 0 8px;
  width: 100%;
}
.side-nav-logo {
  padding-left: 16px;
  height: 32px;
  color: var(--td-text-color-primary);
}
</style>
