<template>
  <div class="product-line-page">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">类型</span>
        <Select v-model="filterType" placeholder="全部" clearable style="width: 140px">
          <Option value="" label="全部" />
          <Option value="app" label="App" />
          <Option value="mini-program" label="小程序" />
          <Option value="web" label="Web" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">名称</span>
        <Input v-model="filterName" placeholder="请输入名称关键字" clearable style="width: 180px" />
      </div>
      <Button theme="primary" @click="handleSearch">搜索</Button>
      <Button theme="default" @click="handleReset">重置</Button>
      <div class="filter-spacer" />
      <Button theme="primary" @click="handleCreate">+ 新建产品线</Button>
    </div>

    <!-- 列表 -->
    <div class="table-card">
      <Table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :hover="true"
        :stripe="false"
        :bordered="false"
        :pagination="{
          current: page.pageNum,
          pageSize: page.pageSize,
          total,
          pageSizeOptions: [20, 50, 100],
          showJumper: true
        }"
        :empty="total === 0 ? '暂无产品线' : ''"
        @page-change="handlePageChange"
      >
        <template #icon="{ row }">
          <div class="product-thumb">
            <img v-if="row.icon" :src="row.icon" alt="" />
            <span v-else class="thumb-placeholder">图片</span>
          </div>
        </template>
        <template #name="{ row }">
          <a class="name-link" @click="handleDetail(row)">{{ row.name }}</a>
        </template>
        <template #type="{ row }">
          <span>{{ formatType(row.type) }}</span>
        </template>
        <template #status="{ row }">
          <Tag v-if="row.status === 'enabled'" theme="success" variant="light" size="small">有效</Tag>
          <Tag v-else theme="warning" variant="light" size="small">待编辑</Tag>
        </template>
        <template #row-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">查看</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleEdit(row)">编辑</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleAttribute(row)">属性管理</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handlePayChannel(row)">支付渠道</a>
          <span class="action-separator">|</span>
          <template v-if="row.status === 'enabled'">
            <a class="action-link" @click="handleDisable(row)">失效</a>
          </template>
          <template v-else>
            <a class="action-link action-danger" @click="handleDelete(row)">删除</a>
          </template>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleContent(row)">内容管理</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleSku(row)">SKU管理</a>
        </template>
      </Table>
    </div>

    <!-- 新建/编辑弹窗 -->
    <ProductLineFormDialog v-model:visible="formDialogVisible" v-model:form-data="formData" :title="formTitle" :is-edit="isEdit" @save="handleSave" />

    <!-- 详情弹窗 -->
    <ProductLineDetailDialog v-model:visible="detailDialogVisible" :detail-data="detailData" />

    <!-- 支付渠道弹窗 -->
    <PayChannelDialog v-model:visible="payChannelDialogVisible" :title="payChannelTitle" :pay-channel-list="payChannelList" />

    <!-- 属性配置弹窗 -->
    <AttributeDialog
      v-model:visible="attrDialogVisible"
      :title="attrTitle"
      :attr-list="attrList"
      @add="handleAddAttribute"
      @edit="handleEditAttribute"
      @save="handleSaveAttribute"
      @delete="handleDeleteAttribute"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ProductLineManager' });
import { onMounted } from 'vue';
import { Button, Input, Option, Select, Table, Tag } from 'tdesign-vue-next';

import AttributeDialog from './components/AttributeDialog.vue';
import PayChannelDialog from './components/PayChannelDialog.vue';
import ProductLineDetailDialog from './components/ProductLineDetailDialog.vue';
import ProductLineFormDialog from './components/ProductLineFormDialog.vue';
import { useProductLine } from './components/types/useProductLine';

/* ===== 从 composable 导入状态和方法 ===== */
const productLine = useProductLine();
const {
  filterType,
  filterName,
  tableData,
  total,
  loading,
  page,
  formDialogVisible,
  formTitle,
  isEdit,
  formData,
  detailDialogVisible,
  detailData,
  payChannelDialogVisible,
  payChannelTitle,
  payChannelList,
  attrDialogVisible,
  attrTitle,
  attrList,
  columns,
  loadData,
  handleSearch,
  handleReset,
  handlePageChange,
  handleCreate,
  handleEdit,
  handleSave,
  handleDetail,
  handleDelete,
  handleDisable,
  handleContent,
  handleSku,
  handlePayChannel,
  handleAttribute,
  handleAddAttribute,
  handleEditAttribute,
  handleSaveAttribute,
  handleDeleteAttribute,
  formatType
} = productLine;

/* ===== 初始化 ===== */
onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.product-line-page {
  padding: 24px;

  .filter-bar {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
    border: 1px solid var(--td-component-stroke);
    display: flex;
    align-items: flex-end;
    gap: 16px;

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .filter-label {
        font-size: 13px;
        color: var(--td-text-color-secondary);
      }
    }

    .filter-spacer {
      flex: 1;
    }
  }

  .table-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .product-thumb {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--td-bg-color-secondarycontainer);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      color: var(--td-text-color-placeholder);
      font-size: 11px;
    }
  }

  .name-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  .action-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }

  .action-danger {
    color: var(--td-error-color);
  }

  .action-separator {
    color: var(--td-component-stroke);
    margin: 0 4px;
  }
}
</style>
