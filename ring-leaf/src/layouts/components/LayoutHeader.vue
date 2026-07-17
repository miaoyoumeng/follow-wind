<template>
  <div :class="layoutCls">
    <t-head-menu :class="menuCls" :theme="theme" expand-type="popup" :value="active">
      <template #logo>
        <span v-if="showLogo" class="header-logo-container" @click="handleNav('/dashboard/base')">
          <!--          <LogoFull class="t-logo" />-->
        </span>
        <div v-else class="header-operate-left">
          <t-button theme="default" shape="square" variant="text" @click="changeCollapsed">
            <t-icon class="collapsed-icon" name="view-list" />
          </t-button>
        </div>
      </template>
      <template #operations>
        <div class="operations-container">
          <!-- 全局通知 -->
          <LayoutNotice />

          <t-dropdown :min-column-width="135" trigger="click">
            <template #dropdown>
              <t-dropdown-menu>
                <t-dropdown-item class="operations-dropdown-container-item" @click="handleNav('/user/index')">
                  <t-icon name="user-circle" />个人中心
                </t-dropdown-item>
                <t-dropdown-item class="operations-dropdown-container-item" @click="handleLogout"> <t-icon name="poweroff" />退出 </t-dropdown-item>
              </t-dropdown-menu>
            </template>
            <t-button class="header-user-btn" theme="default" variant="text">
              <template #icon>
                <t-icon class="header-user-avatar" name="user-circle" />
              </template>
              <div class="header-user-account">
                Tencent
                <t-icon name="chevron-down" />
              </div>
            </t-button>
          </t-dropdown>
          <t-tooltip placement="bottom" content="系统设置">
            <t-button theme="default" shape="square" variant="text">
              <t-icon name="setting" @click="toggleSettingPanel" />
            </t-button>
          </t-tooltip>
        </div>
      </template>
    </t-head-menu>
  </div>
</template>
<script setup lang="ts">
import { PropType, computed, watch } from 'vue';
import { MenuRoute } from 'tdesign-vue-next';

import LayoutNotice from './LayoutNotice.vue';
import { logout } from '@/api/login.ts';

const props = defineProps({
  theme: {
    type: String,
    default: ''
  },
  layout: {
    type: String,
    default: 'top'
  },
  showLogo: {
    type: Boolean,
    default: false
  },
  menu: {
    type: Array as PropType<MenuRoute[]>,
    default: () => []
  },
  isFixed: {
    type: Boolean,
    default: false
  },
  isCompact: {
    type: Boolean,
    default: false
  },
  maxLevel: {
    type: Number,
    default: 3
  }
});
watch(props, () => {
  console.log('header watch....');
});
/* 属性监听 */
const emit = defineEmits(['handleCollapsed']);

const toggleSettingPanel = () => {
  console.log('toggleSettingPanel');
};

const prefix = import.meta.env.VITE_GLOB_APP_PREFIX as string;
const active = computed(() => getActive());

const layoutCls = computed(() => [`${prefix}-header-layout`]);

const menuCls = computed(() => {
  const { isFixed, layout, isCompact } = props;
  return [
    {
      [`${prefix}-header-menu`]: !isFixed,
      [`${prefix}-header-menu-fixed`]: isFixed,
      [`${prefix}-header-menu-fixed-side`]: layout === 'side' && isFixed,
      [`${prefix}-header-menu-fixed-side-compact`]: layout === 'side' && isFixed && isCompact
    }
  ];
});

const changeCollapsed = () => {
  emit('handleCollapsed');
};

const handleNav = (url: string) => {
  console.log(url);
};

const handleLogout = () => {
  logout();
};

const getActive = (maxLevel = 3) => {
  console.log('getActive: maxLevel = ' + maxLevel);
  return '';
};
</script>
<style scoped lang="scss">
.header-logo-container {
  width: 184px;
  height: 26px;
  display: flex;
  margin-left: 24px;
  color: var(--td-text-color-primary);

  .t-logo {
    width: 100%;
    height: 100%;
    &:hover {
      cursor: pointer;
    }
  }

  &:hover {
    cursor: pointer;
  }
}
.header-operate-left {
  display: flex;
  margin-left: 20px;
  align-items: normal;
  line-height: 0;

  .collapsed-icon {
    font-size: 20px;
  }
}

.operations-container {
  display: flex;
  align-items: center;
  margin-right: 12px;

  .t-popup__reference {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .t-button {
    margin: 0 8px;
    &.header-user-btn {
      margin: 0;
    }
  }

  .t-icon {
    font-size: 20px;
    &.general {
      margin-right: 16px;
    }
  }
  .t-dropdown__item-text {
    display: flex;
    align-items: center;
  }
  :deep(.t-dropdown__item-text) {
    display: flex;
    align-items: center;
  }
}

.header-operate-left {
  display: flex;
  margin-left: 20px;
  align-items: normal;
  line-height: 0;

  .collapsed-icon {
    font-size: 20px;
  }
}

.operations-dropdown-container-item {
  width: 100%;
  display: flex;
  align-items: center;
  .t-icon {
    margin-right: 8px;
  }
}
</style>
