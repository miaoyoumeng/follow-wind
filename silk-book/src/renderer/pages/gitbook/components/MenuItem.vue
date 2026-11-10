<template>
  <div class="menu-node">
    <!-- 叶子节点或达到最大深度：渲染 MenuItem -->
    <t-menu-item v-if="!hasChildren || isMaxDepth" :value="node.title" @click="handleClick">
      <span class="menu-title">{{ node.title }}</span>
    </t-menu-item>

    <!-- 有子节点且未达最大深度：渲染 Submenu -->
    <t-submenu v-else :value="node.title" :title="node.title">
      <template #title>
        <span class="menu-title">{{ node.title }}</span>
      </template>
      <menu-item
        v-for="(child, index) in node.children"
        :key="`${index}-${child.level}`"
        :node="child"
        :max-depth="maxDepth"
        :current-depth="currentDepth + 1"
        @select="handleChildSelect"
      />
    </t-submenu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NavItem } from '@/typings/global';

interface Props {
  node: NavItem;
  maxDepth: number;
  currentDepth: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxDepth: 4,
  currentDepth: 0
});

const emit = defineEmits<{
  select: [node: NavItem];
}>();

// 是否有子节点
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

// 是否达到最大深度
const isMaxDepth = computed(() => {
  return props.currentDepth >= props.maxDepth - 1;
});

// 处理点击
const handleClick = (): void => {
  emit('select', props.node);
};

// 处理子节点选择
const handleChildSelect = (node: NavItem): void => {
  emit('select', node);
};
</script>

<style lang="scss" scoped>
.menu-node {
  .menu-title {
    font-size: 14px;
    color: #333;
  }
}
</style>
