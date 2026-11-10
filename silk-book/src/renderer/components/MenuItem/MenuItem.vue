<template>
  <div class="menu-item" :class="{ active: isActive }" @click="handleClick">
    <div class="menu-icon-wrapper" :style="iconWrapperStyle">
      <!-- SVG 图标 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <svg v-if="svgContent" v-html="svgContent" class="menu-icon-svg" />
      <!-- TDesign 图标 -->
      <t-icon v-else-if="iconName" :name="iconName" class="menu-icon" />
    </div>
    <span class="menu-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  // 是否激活
  isActive?: boolean;
  // 菜单文本
  text: string;
  // SVG 图标内容
  svgContent?: string;
  // TDesign 图标名称
  iconName?: string;
  // 图标包装器宽度
  iconWidth?: number;
  // 图标包装器高度
  iconHeight?: number;
  // 链接路径
  path?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  svgContent: '',
  iconName: '',
  iconWidth: 48,
  iconHeight: 32,
  path: ''
});

const emit = defineEmits<{
  click: [path: string];
}>();

// 图标包装器样式
const iconWrapperStyle = computed(() => ({
  width: `${props.iconWidth}px`,
  height: `${props.iconHeight}px`
}));

// 处理点击
const handleClick = (): void => {
  if (props.path) {
    emit('click', props.path);
  }
};
</script>

<style lang="scss" scoped>
.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    background-color: transparent;
    color: #0052d9;
  }
}

.menu-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  background-color: #fafafa;

  :deep(svg) {
    width: 100% !important;
    height: 100% !important;
    max-width: 100%;
    max-height: 100%;
  }
}

.menu-icon-svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.menu-icon {
  font-size: 24px;
}

.menu-text {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  text-align: center;
}
</style>
