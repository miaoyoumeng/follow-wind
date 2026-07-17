<template>
  <t-layout>
    <t-aside :width="data.asideWidth">
      <SideNav :menu-collapsed="data.menuCollapsed" />
    </t-aside>
    <t-layout :style="data.contentWidth">
      <t-content>
        <t-layout>
          <t-header>
            <Header :is-compact="data.menuCollapsed" theme="" :show-logo="false" @handle-collapsed="handleCollapsed" />
          </t-header>
          <t-content class="p20">
            <Main />
          </t-content>
        </t-layout>
      </t-content>
    </t-layout>
  </t-layout>
</template>
<script setup lang="ts">
import Header from '@/layouts/components/LayoutHeader.vue';
import SideNav from '@/layouts/components/LayoutSideNav.vue';
import Main from '@/layouts/components/LayoutMain.vue';
import { onMounted, reactive } from 'vue';

interface DataProps {
  asideWidth: string;
  contentWidth: string;
  menuCollapsed: boolean;
}
const data: DataProps = reactive<DataProps>({
  asideWidth: '-', // 左侧菜单的宽度
  contentWidth: 'width: 100%', // 左侧菜单的宽度
  menuCollapsed: false // 左侧菜单是否收缩
});

onMounted(() => {
  calCollapsed();
});
const handleCollapsed = () => {
  // 左侧菜单
  data.menuCollapsed = !data.menuCollapsed;
  calCollapsed();
};
const calCollapsed = () => {
  if (!data.menuCollapsed) {
    data.asideWidth = '232px';
    data.contentWidth = 'width: calc(100% - 232px)'; /* 宽度为容器的100%，减去两边共40px */
  } else {
    data.asideWidth = '64px';
    data.contentWidth = 'width: calc(100% - 64px)';
  }
};
</script>
