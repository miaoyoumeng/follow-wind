<template>
  <Dialog :visible="visible" :header="title" width="560px" :footer="false" @update:visible="$emit('update:visible', $event)">
    <!-- 属性表单弹窗 -->
    <Dialog :visible="formVisible" :header="isEdit ? '编辑属性' : '新增属性'" width="480px" :footer="false" @update:visible="formVisible = $event">
      <Form :data="formData" label-align="top">
        <FormItem label="属性名称">
          <Input v-model="formData.name" placeholder="请输入属性名称" />
        </FormItem>
        <FormItem label="属性值">
          <Input v-model="formData.value" placeholder="请输入属性值" />
        </FormItem>
      </Form>
      <div class="dialog-footer">
        <Button theme="default" @click="formVisible = false">取消</Button>
        <Button theme="primary" @click="handleSaveAttribute">确定</Button>
      </div>
    </Dialog>

    <div v-if="attrList.length > 0">
      <table class="inner-table">
        <thead>
          <tr>
            <th>属性名称</th>
            <th>属性类型</th>
            <th>属性常量</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in attrList" :key="item.id">
            <td>{{ item.name }}</td>
            <td class="mono-cell">{{ item.value }}</td>
            <td style="text-align: center">
              <a class="action-link" @click="handleEditAttribute(item)">编辑</a>
              <span class="action-separator">|</span>
              <a class="action-link action-danger" @click="handleDeleteAttribute(item)">删除</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-inner">暂无属性</div>
    <div class="dialog-footer">
      <Button theme="default" @click="$emit('update:visible', false)">关闭</Button>
      <Button theme="primary" @click="handleAddAttribute">+ 新增属性</Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Button, Dialog, Form, FormItem, Input } from 'tdesign-vue-next';
import { ref } from 'vue';
import type { ProductLineAttribute } from '@/api/models/product-line';

interface Props {
  visible: boolean;
  title: string;
  attrList: ProductLineAttribute.AttributeItem[];
}

defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  add: [];
  edit: [row: ProductLineAttribute.AttributeItem];
  delete: [row: ProductLineAttribute.AttributeItem];
  save: [];
}>();

const formVisible = ref(false);
const isEdit = ref(false);
const formData = ref({ id: 0, name: '', value: '' });

const handleAddAttribute = (): void => {
  isEdit.value = false;
  formData.value = { id: 0, name: '', value: '' };
  formVisible.value = true;
  emit('add');
};

const handleEditAttribute = (row: ProductLineAttribute.AttributeItem): void => {
  isEdit.value = true;
  formData.value = { id: row.id, name: row.name, value: row.value };
  formVisible.value = true;
  emit('edit', row);
};

const handleSaveAttribute = (): void => {
  emit('save');
};

const handleDeleteAttribute = (row: ProductLineAttribute.AttributeItem): void => {
  emit('delete', row);
};
</script>

<style scoped lang="scss">
.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead th {
    background: var(--td-bg-color-container-hover);
    padding: 10px 12px;
    text-align: left;
    font-weight: 500;
    color: var(--td-text-color-secondary);
    border-bottom: 1px solid var(--td-component-stroke);
  }

  tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--td-component-stroke);
    color: var(--td-text-color-primary);
  }

  tbody tr:hover {
    background: var(--td-bg-color-container-hover);
  }
}

.mono-cell {
  font-family: 'Fira Code', Menlo, monospace;
}

.empty-inner {
  text-align: center;
  padding: 32px;
  color: var(--td-text-color-placeholder);
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--td-component-stroke);
  margin-top: 16px;
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
</style>
