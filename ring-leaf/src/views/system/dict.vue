<script setup lang="ts" name="DictManager">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Dialog, Form, FormItem, Input, Button, Popconfirm, Textarea } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import {
  getNamespaceListApi,
  createNamespaceApi,
  updateNamespaceApi,
  getKeyValueListApi,
  createKeyValueApi,
  updateKeyValueApi,
  deleteKeyValueApi
} from '@/api/dict.ts';
import type { DictNamespace, DictKeyValue } from '@/api/modules/dict.ts';

/* ===== Namespace 列表 ===== */
const namespaceList = ref<DictNamespace.NamespaceItem[]>([]);
const namespaceTotal = ref(0);
const namespacePageNum = ref(1);
const namespacePageSize = ref(20);
const namespaceKeyword = ref('');
const selectedNamespace = ref<DictNamespace.NamespaceItem | null>(null);

/* ===== Key-Value 列表 ===== */
const keyValueList = ref<DictKeyValue.KeyValueItem[]>([]);
const keyValueKeyword = ref('');

/* ===== Namespace 弹窗 ===== */
const namespaceDialogVisible = ref(false);
const namespaceDialogMode = ref<'create' | 'edit'>('create');
const namespaceForm = ref({ id: 0, namespace: '', description: '' });
const namespaceFormError = ref('');

/* ===== Key-Value 弹窗 ===== */
const keyValueDialogVisible = ref(false);
const keyValueDialogMode = ref<'create' | 'edit'>('create');
const keyValueForm = ref({ id: 0, key: '', value: '', description: '' });
const keyValueFormError = ref('');

/* ===== 加载 Namespace ===== */
const loadNamespace = async () => {
  const { data } = await getNamespaceListApi({
    keyword: namespaceKeyword.value,
    pageNum: namespacePageNum.value,
    pageSize: namespacePageSize.value
  });
  if (data) {
    namespaceList.value = data.list;
    namespaceTotal.value = data.total;
  }
};

/* ===== 加载 Key-Value ===== */
const loadKeyValue = async (namespace: string) => {
  const { data } = await getKeyValueListApi({
    namespace,
    keyword: keyValueKeyword.value
  });
  if (data) {
    keyValueList.value = data;
  }
};

/* ===== Namespace 操作 ===== */
const handleSearchNamespace = () => {
  namespacePageNum.value = 1;
  loadNamespace();
};

const handleCreateNamespace = () => {
  namespaceDialogMode.value = 'create';
  namespaceForm.value = { id: 0, namespace: '', description: '' };
  namespaceFormError.value = '';
  namespaceDialogVisible.value = true;
};

const handleEditNamespace = (row: DictNamespace.NamespaceItem) => {
  namespaceDialogMode.value = 'edit';
  namespaceForm.value = { id: row.id, namespace: row.namespace, description: row.description };
  namespaceFormError.value = '';
  namespaceDialogVisible.value = true;
};

const validateNamespace = (val: string): { valid: boolean; error: string } => {
  if (!val.trim()) {
    return { valid: false, error: 'Namespace 不能为空' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(val)) {
    return { valid: false, error: '仅支持字母、数字、下划线' };
  }
  return { valid: true, error: '' };
};

const confirmSaveNamespace = async () => {
  const result = validateNamespace(namespaceForm.value.namespace);
  if (!result.valid) {
    namespaceFormError.value = result.error;
    return;
  }
  try {
    if (namespaceDialogMode.value === 'create') {
      await createNamespaceApi({ namespace: namespaceForm.value.namespace, description: namespaceForm.value.description });
      MessagePlugin.success('Namespace 已创建');
    } else {
      await updateNamespaceApi({ id: namespaceForm.value.id, description: namespaceForm.value.description });
      MessagePlugin.success('Namespace 已更新');
    }
    namespaceDialogVisible.value = false;
    loadNamespace();
  } catch (e: any) {
    namespaceFormError.value = e.message;
  }
};

/* ===== Namespace 分页 ===== */
const handleNamespacePageChange = (pageInfo: PageInfo) => {
  namespacePageNum.value = pageInfo.current;
  namespacePageSize.value = pageInfo.pageSize;
  loadNamespace();
};

/* ===== 行选中 ===== */
const handleRowClick = ({ row }: { row: DictNamespace.NamespaceItem }) => {
  selectedNamespace.value = row;
  keyValueKeyword.value = '';
  loadKeyValue(row.namespace);
};

/* ===== Key-Value 操作 ===== */
const handleSearchKey = () => {
  if (selectedNamespace.value) {
    loadKeyValue(selectedNamespace.value.namespace);
  }
};

const handleCreateKeyValue = () => {
  if (!selectedNamespace.value) {
    MessagePlugin.warning('请先选择左侧 Namespace');
    return;
  }
  keyValueDialogMode.value = 'create';
  keyValueForm.value = { id: 0, key: '', value: '', description: '' };
  keyValueFormError.value = '';
  keyValueDialogVisible.value = true;
};

const handleEditKeyValue = (row: DictKeyValue.KeyValueItem) => {
  keyValueDialogMode.value = 'edit';
  keyValueForm.value = { id: row.id, key: row.key, value: row.value, description: row.description };
  keyValueFormError.value = '';
  keyValueDialogVisible.value = true;
};

const confirmSaveKeyValue = async () => {
  if (!selectedNamespace.value) return;
  if (!keyValueForm.value.key.trim()) {
    keyValueFormError.value = 'Key 不能为空';
    return;
  }
  if (!keyValueForm.value.value.trim()) {
    keyValueFormError.value = 'Value 不能为空';
    return;
  }
  if (keyValueForm.value.description.length > 200) {
    keyValueFormError.value = '描述不能超过 200 字';
    return;
  }
  try {
    const ns = selectedNamespace.value.namespace;
    if (keyValueDialogMode.value === 'create') {
      await createKeyValueApi({
        namespace: ns,
        key: keyValueForm.value.key,
        value: keyValueForm.value.value,
        description: keyValueForm.value.description
      });
      MessagePlugin.success('Key-Value 已创建');
    } else {
      await updateKeyValueApi({
        id: keyValueForm.value.id,
        namespace: ns,
        key: keyValueForm.value.key,
        value: keyValueForm.value.value,
        description: keyValueForm.value.description
      });
      MessagePlugin.success('Key-Value 已更新');
    }
    keyValueDialogVisible.value = false;
    loadKeyValue(ns);
  } catch (e: any) {
    keyValueFormError.value = e.message;
  }
};

const handleDeleteKeyValue = async (row: DictKeyValue.KeyValueItem) => {
  try {
    await deleteKeyValueApi({ id: row.id });
    MessagePlugin.success('Key-Value 已删除');
    if (selectedNamespace.value) {
      loadKeyValue(selectedNamespace.value.namespace);
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 表格列 ===== */
const namespaceColumns: PrimaryTableCol<DictNamespace.NamespaceItem>[] = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'namespace', title: 'Namespace', width: 160 },
  { colKey: 'createdAt', title: '创建时间', width: 180 },
  { colKey: 'description', title: '描述' },
  { colKey: 'row-operation', title: '操作', width: 80, fixed: 'right' }
];

const keyValueColumns: PrimaryTableCol<DictKeyValue.KeyValueItem>[] = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'key', title: 'Key', width: 160 },
  { colKey: 'value', title: 'Value' },
  { colKey: 'description', title: '描述', width: 120 },
  { colKey: 'updatedAt', title: '修改时间', width: 180 },
  { colKey: 'row-operation', title: '操作', width: 120, fixed: 'right' }
];

/* ===== 初始化 ===== */
onMounted(() => {
  loadNamespace();
});
</script>

<template>
  <div class="dict-page">
    <div class="page-header">
      <h2 class="page-title">系统字典</h2>
    </div>

    <div class="dual-list-container">
      <!-- 左侧 Namespace 列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">Namespace 列表</span>
          <div class="panel-actions">
            <Input v-model="namespaceKeyword" placeholder="搜索 Namespace" class="search-input" @enter="handleSearchNamespace">
              <template #suffix>
                <Button variant="text" size="small" @click="handleSearchNamespace">搜索</Button>
              </template>
            </Input>
            <Button theme="primary" size="small" @click="handleCreateNamespace">新建 Namespace</Button>
          </div>
        </div>

        <t-table
          :data="namespaceList"
          :columns="namespaceColumns"
          row-key="id"
          :hover="true"
          :stripe="false"
          :bordered="false"
          :selected-row-keys="selectedNamespace ? [selectedNamespace.id] : []"
          @row-click="handleRowClick"
          @page-change="handleNamespacePageChange"
          :pagination="{
            current: namespacePageNum,
            pageSize: namespacePageSize,
            total: namespaceTotal,
            showJumper: false,
            showPageSize: false
          }"
          empty="暂无 Namespace 数据，请新建"
        >
          <template #createdAt="{ row }">
            {{ row.createdAt.slice(0, 10) }}
          </template>
          <template #description="{ row }">
            <span class="text-ellipsis" :title="row.description">{{ row.description || '-' }}</span>
          </template>
          <template #row-operation="{ row }">
            <a class="action-link" @click.stop="handleEditNamespace(row)">编辑</a>
          </template>
        </t-table>
      </div>

      <!-- 右侧 Key-Value 列表 -->
      <div class="right-panel">
        <div class="panel-header">
          <span class="panel-title">
            Key-Value 列表
            <span v-if="selectedNamespace" class="namespace-tag">（{{ selectedNamespace.namespace }}）</span>
          </span>
          <div class="panel-actions">
            <Input v-model="keyValueKeyword" placeholder="搜索 Key" class="search-input" :disabled="!selectedNamespace" @enter="handleSearchKey">
              <template #suffix>
                <Button variant="text" size="small" :disabled="!selectedNamespace" @click="handleSearchKey">搜索</Button>
              </template>
            </Input>
            <Button theme="primary" size="small" :disabled="!selectedNamespace" @click="handleCreateKeyValue">新建 Key-Value</Button>
          </div>
        </div>

        <t-table
          :data="keyValueList"
          :columns="keyValueColumns"
          row-key="id"
          :hover="true"
          :stripe="false"
          :bordered="false"
          :empty="!selectedNamespace ? '请先选择左侧 Namespace' : '暂无 Key-Value 数据'"
        >
          <template #updatedAt="{ row }">
            {{ row.updatedAt.slice(0, 10) }}
          </template>
          <template #description="{ row }">
            <span class="text-ellipsis" :title="row.description">{{ row.description || '-' }}</span>
          </template>
          <template #row-operation="{ row }">
            <a class="action-link" @click="handleEditKeyValue(row)">编辑</a>
            <popconfirm content="确定删除该 Key-Value 吗？" theme="warning" @confirm="handleDeleteKeyValue(row)">
              <a class="action-link danger" @click.stop>删除</a>
            </popconfirm>
          </template>
        </t-table>
      </div>
    </div>

    <!-- 新建/编辑 Namespace 弹窗 -->
    <Dialog
      v-model:visible="namespaceDialogVisible"
      :header="namespaceDialogMode === 'create' ? '新建 Namespace' : '编辑 Namespace'"
      width="480px"
      attach="body"
      @confirm="confirmSaveNamespace"
    >
      <Form layout="vertical" class="namespace-form">
        <FormItem label="Namespace">
          <Input v-model="namespaceForm.namespace" :disabled="namespaceDialogMode === 'edit'" placeholder="全局唯一标识，仅支持字母、数字、下划线" />
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model="namespaceForm.description"
            :maxlength="200"
            :show-limit-number="true"
            placeholder="可选，200 字以内"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </FormItem>
      </Form>
      <div v-if="namespaceFormError" class="form-error">{{ namespaceFormError }}</div>
    </Dialog>

    <!-- 新建/编辑 Key-Value 弹窗 -->
    <Dialog
      v-model:visible="keyValueDialogVisible"
      :header="keyValueDialogMode === 'create' ? '新建 Key-Value' : '编辑 Key-Value'"
      width="480px"
      attach="body"
      @confirm="confirmSaveKeyValue"
    >
      <Form layout="vertical" class="keyvalue-form">
        <FormItem label="Key">
          <Input v-model="keyValueForm.key" placeholder="同一 Namespace 下唯一" />
        </FormItem>
        <FormItem label="Value">
          <Input v-model="keyValueForm.value" placeholder="字典值内容" />
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model="keyValueForm.description"
            :maxlength="200"
            :show-limit-number="true"
            placeholder="可选，200 字以内"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </FormItem>
      </Form>
      <div v-if="keyValueFormError" class="form-error">{{ keyValueFormError }}</div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.dict-page {
  padding: 24px;

  .page-header {
    margin-bottom: 24px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

  .dual-list-container {
    display: flex;
    gap: 16px;
    height: calc(100vh - 180px);
  }

  .left-panel {
    width: 45%;
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .right-panel {
    flex: 1;
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid var(--td-component-stroke);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      white-space: nowrap;

      .namespace-tag {
        color: var(--td-text-color-placeholder);
        font-weight: normal;
        font-size: 12px;
      }
    }

    .panel-actions {
      display: flex;
      gap: 8px;
      flex: 1;
      justify-content: flex-end;

      .search-input {
        width: 200px;
      }
    }
  }

  .text-ellipsis {
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;
    margin-right: 12px;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }

    &.danger {
      color: var(--td-error-color);
    }
  }

  .namespace-form,
  .keyvalue-form {
    .form-error {
      color: var(--td-error-color);
      font-size: 12px;
      margin-top: 8px;
    }
  }
}
</style>
