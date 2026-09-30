<template>
  <Dialog :visible="visible" :header="title" width="760px" :footer="false" @update:visible="$emit('update:visible', $event)">
    <div v-if="payChannelList.length > 0">
      <table class="inner-table">
        <thead>
          <tr>
            <th style="width: 120px">支付渠道</th>
            <th>配置参数</th>
            <th style="width: 100px; text-align: center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in payChannelList" :key="item.id">
            <td>{{ item.channelName }}</td>
            <td class="mono-cell">{{ item.merchantId }}</td>
            <td style="text-align: center">
              <a class="action-link">编辑</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-inner">暂无绑定</div>
    <div class="dialog-footer">
      <Button theme="default" @click="$emit('update:visible', false)">关闭</Button>
      <Button theme="primary">+ 新增绑定</Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Button, Dialog } from 'tdesign-vue-next';
import type { ProductLinePayChannel } from '@/api/models/product-line';

interface Props {
  visible: boolean;
  title: string;
  payChannelList: ProductLinePayChannel.PayChannelItem[];
}

defineEmits<{ 'update:visible': [value: boolean] }>();
defineProps<Props>();
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
</style>
