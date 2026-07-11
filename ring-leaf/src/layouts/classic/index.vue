<template>
  <t-layout>
    <t-aside :width="data.asideWidth">
      <SideNav :menu-collapsed="data.menuCollapsed" />
    </t-aside>
    <t-content>
      <t-layout>
        <t-header> <Header :is-compact="data.menuCollapsed" theme="" :show-logo="false" @handle-collapsed="handleCollapsed" /> </t-header>
      </t-layout>
      <t-content>
        <Main />
      </t-content>
    </t-content>
  </t-layout>
</template>
<script setup lang="ts">
import Header from '@/layouts/components/LayoutHeader.vue';
import SideNav from '@/layouts/components/LayoutSideNav.vue';
import Main from '@/layouts/components/LayoutMain.vue';
import { reactive } from 'vue';

interface DataProps {
  asideWidth: string;
  menuCollapsed: boolean;
}
const data: DataProps = reactive<DataProps>({
  asideWidth: '-', // 左侧菜单的宽度
  menuCollapsed: false // 左侧菜单是否收缩
});

const handleCollapsed = () => {
  // 左侧菜单
  data.menuCollapsed = !data.menuCollapsed;
  if (!data.menuCollapsed) {
    data.asideWidth = '232px';
  } else {
    data.asideWidth = '64px';
  }
};
</script>
