<template>
  <div class="markdown-layout">
    <!-- 顶部页头 -->
    <header class="markdown-header">
      <div class="header-content">
        <h1 class="header-title">Markdown 文档</h1>
      </div>
    </header>

    <div class="markdown-body">
      <!-- 左侧导航 -->
      <aside class="markdown-sidebar">
        <div class="sidebar-inner">
          <t-menu theme="light">
            <menu-item
              v-for="(node, index) in treeData"
              :key="`${index}-${node.level}`"
              :node="node"
              :max-depth="4"
              :current-depth="0"
              @select="handleNodeSelect"
            />
          </t-menu>
        </div>
      </aside>

      <!-- 右侧内容 -->
      <main class="markdown-content">
        <div class="markdown-render" id="markdown-container"></div>
        <!--        <div class="content-empty" v-else>-->
        <!--          <t-empty description="请选择一个文档查看内容" />-->
        <!--        </div>-->
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Cherry from 'cherry-markdown';

import MenuItem from './components/MenuItem.vue';
import { NavItem } from '@/typings/global';

import 'cherry-markdown/dist/cherry-markdown.css';

// 左侧导航树数据
const treeData = ref<NavItem[]>([]);

// 当前选中的文档 ID
const currentMd = ref<string>('');

// 当前文档内容
let cherry: Cherry | null = null;

// 处理节点选择
const handleNodeSelect = async (node: NavItem): Promise<void> => {
  if (!node.path) {
    return;
  }
  if (!node.children || node.children.length === 0) {
    currentMd.value = node.path;
    await renderMarkdown(node.path);
  }
};

onMounted(async () => {
  treeData.value = await window.electronApi.renderGitBookTree();
  cherry = new Cherry({
    id: 'markdown-container',
    value: '',
    editor: {
      defaultModel: 'previewOnly',
      toolbar: false // 不显示工具栏
    },
    // 隐藏引擎工具栏
    engine: {
      global: {
        toolbar: false,
        classicBr: false
      }
    },
    previewer: {
      enablePreviewerBubble: false
    },
    callback: {
      /**
       * 全局的URL处理器
       * @param {string} url 来源url
       * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
       * @param {Function} callback 函数
       * @returns
       */
      urlProcessor: (url: string, srcType: string, callback: Function) => {
        if (srcType === 'image') {
          setTimeout(() => {
            const imagePath = window.electronApi.renderImage(url, currentMd.value);
            imagePath?.then(data => {
              callback((url = data));
            });
          });
        }
      }
    }
  });
  await renderMarkdown('README.md');
});

const renderMarkdown = async (path: string) => {
  if (!path) {
    return;
  }
  const markdown = await window.electronApi.renderMarkdown(path);
  if (cherry) {
    cherry.setValue(markdown);
  }
};
</script>

<style lang="scss" scoped>
.markdown-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

// 顶部页头
.markdown-header {
  height: 60px;
  border-bottom: 1px solid #e7e7e7;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 24px;

  .header-content {
    display: flex;
    align-items: center;
  }

  .header-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
}

// 主体区域
.markdown-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// 左侧导航
.markdown-sidebar {
  width: 200px;
  min-width: 200px;
  border-right: 1px solid #e7e7e7;
  background-color: #fafafa;
  overflow-y: auto;

  .sidebar-inner {
    padding: 0;
  }
}

// 右侧内容
.markdown-content {
  flex: 1;
  overflow-y: auto;
  background-color: #fff;

  .content-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .content-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
}

// Markdown 渲染样式
.markdown-render {
  :deep(h1) {
    font-size: 32px;
    margin-bottom: 16px;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }

  :deep(h2) {
    font-size: 24px;
    margin-bottom: 16px;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }

  :deep(h3) {
    font-size: 20px;
    margin-bottom: 12px;
  }

  :deep(p) {
    line-height: 1.75;
    margin-bottom: 16px;
    color: #24292e;
  }

  :deep(code) {
    background-color: #f6f8fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 85%;
  }

  :deep(pre) {
    background-color: #f6f8fa;
    padding: 16px;
    border-radius: 6px;
    overflow: auto;
    margin-bottom: 16px;

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(blockquote) {
    border-left: 4px solid #dfe2e5;
    padding-left: 16px;
    color: #6a737d;
    margin: 16px 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 24px;
    margin-bottom: 16px;
  }

  :deep(li) {
    line-height: 1.75;
  }

  :deep(a) {
    color: #0366d6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 16px;

    th,
    td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
  }
}
</style>
