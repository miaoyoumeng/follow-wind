<template>
  <Dialog :visible="visible" header="产品线详情" width="640px" :footer="false" @update:visible="$emit('update:visible', $event)">
    <div v-if="detailData" class="detail-content">
      <div class="detail-row">
        <span class="detail-label">ID</span>
        <span class="detail-value detail-code">{{ detailData.id }}</span>
      </div>
      <div class="detail-row detail-full">
        <span class="detail-label">主图</span>
        <span class="detail-value">
          <span class="detail-thumb">
            <img v-if="detailData.icon" :src="detailData.icon" alt="" />
            <template v-else>主图</template>
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">名称</span>
        <span class="detail-value">{{ detailData.name }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">代号</span>
        <span class="detail-value detail-code">{{ detailData.code }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">类型</span>
        <span class="detail-value">{{ formatType(detailData.type) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">状态</span>
        <span class="detail-value">
          <Tag v-if="detailData.status === 'enabled'" theme="success" variant="light" size="small">有效</Tag>
          <Tag v-else theme="warning" variant="light" size="small">待编辑</Tag>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">修改时间</span>
        <span class="detail-value detail-muted">{{ detailData.updatedAt }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">最后修改人</span>
        <span class="detail-value detail-muted">{{ detailData.updatedBy }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">创建人</span>
        <span class="detail-value detail-muted">{{ detailData.createdBy }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">创建时间</span>
        <span class="detail-value detail-muted">{{ detailData.createdAt }}</span>
      </div>
      <div class="detail-row detail-full">
        <span class="detail-label">描述</span>
        <span class="detail-value">{{ detailData.description || '-' }}</span>
      </div>
    </div>
    <div class="dialog-footer">
      <Button theme="default" @click="$emit('update:visible', false)">关闭</Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Button, Dialog, Tag } from 'tdesign-vue-next';
import type { ProductLine } from '@/api/models/product-line';

interface Props {
  visible: boolean;
  detailData: ProductLine.ProductLineItem | null;
}

withDefaults(defineProps<Props>(), {});
defineEmits<{ 'update:visible': [value: boolean] }>();

const PRODUCT_TYPE_MAP: Record<string, string> = {
  app: 'App',
  'mini-program': '小程序',
  web: 'Web'
};

const formatType = (type: string): string => PRODUCT_TYPE_MAP[type] || type;
</script>

<style scoped lang="scss">
.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;

  .detail-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid var(--td-component-stroke);

    .detail-label {
      width: 120px;
      color: var(--td-text-color-secondary);
      font-size: 13px;
      flex-shrink: 0;
    }

    .detail-value {
      flex: 1;
      color: var(--td-text-color-primary);
      font-size: 13px;
      word-break: break-all;
    }

    .detail-code {
      font-family: 'Fira Code', Menlo, monospace;
    }

    .detail-muted {
      color: var(--td-text-color-placeholder);
    }

    .detail-thumb {
      width: 80px;
      height: 80px;
      border-radius: 6px;
      background: var(--td-bg-color-secondarycontainer);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--td-text-color-placeholder);
      font-size: 12px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }
    }
  }

  .detail-full {
    grid-column: 1 / -1;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--td-component-stroke);
  margin-top: 16px;
}
</style>
