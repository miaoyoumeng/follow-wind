<script setup lang="ts" name="MessageTemplateManager">
import { ref, onMounted } from 'vue';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import { getTemplateListApi, getTemplateDetailApi, getTemplateChannelOptionsApi } from '@/api/message.ts';
import type { MessageTemplate } from '@/api/modules/message.ts';

/* ===== 列表数据 ===== */
const templateList = ref<MessageTemplate.TemplateItem[]>([]);
const templateTotal = ref(0);
const templateLoading = ref(false);
const pageParams = ref({ pageNum: 1, pageSize: 20 });

/* ===== 筛选条件 ===== */
const filterName = ref('');
const filterChannel = ref<MessageTemplate.ChannelType | ''>('');
const filterContent = ref('');

/* ===== 渠道选项 ===== */
const channelOptions = ref<MessageTemplate.ChannelOption[]>([]);

/* ===== 详情弹窗 ===== */
const detailVisible = ref(false);
const detailData = ref<MessageTemplate.TemplateItem | null>(null);
const detailLoading = ref(false);

/* ===== 表格列定义 ===== */
const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'id', width: 60 },
  { colKey: 'name', title: '名称', width: 140 },
  { colKey: 'productLine', title: '产品线', width: 100 },
  { colKey: 'scene', title: '场景', width: 100 },
  { colKey: 'channelName', title: '渠道', width: 100 },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'content', title: '内容', width: 250 },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'arrivalRate', title: '到达率', width: 100 },
  { colKey: 'row-operation', title: '操作', width: 80, fixed: 'right' }
];

/* ===== 到达率计算 ===== */
const getArrivalRate = (row: MessageTemplate.TemplateItem): string => {
  return `${row.arrivalCount}/${row.sendCount}`;
};

/* ===== 数据加载 ===== */
const loadData = async () => {
  templateLoading.value = true;
  try {
    const { data } = await getTemplateListApi({
      name: filterName.value || undefined,
      channel: filterChannel.value || undefined,
      content: filterContent.value || undefined,
      pageNum: pageParams.value.pageNum,
      pageSize: pageParams.value.pageSize
    });
    if (data) {
      templateList.value = data.list;
      templateTotal.value = data.total;
    }
  } finally {
    templateLoading.value = false;
  }
};

const loadOptions = async () => {
  const { data } = await getTemplateChannelOptionsApi();
  if (data) {
    channelOptions.value = data;
  }
};

/* ===== 筛选操作 ===== */
const handleSearch = () => {
  pageParams.value.pageNum = 1;
  loadData();
};

const handleReset = () => {
  filterName.value = '';
  filterChannel.value = '';
  filterContent.value = '';
  pageParams.value.pageNum = 1;
  loadData();
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  pageParams.value.pageNum = pageInfo.current;
  pageParams.value.pageSize = pageInfo.pageSize;
  loadData();
};

/* ===== 查看详情 ===== */
const handleDetail = async (row: MessageTemplate.TemplateItem) => {
  detailLoading.value = true;
  try {
    const { data } = await getTemplateDetailApi({ id: row.id });
    detailData.value = data || null;
    detailVisible.value = true;
  } finally {
    detailLoading.value = false;
  }
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadOptions();
  loadData();
});
</script>

<template>
  <div class="message-template-page">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">名称</label>
          <t-input v-model="filterName" placeholder="请输入模板名称" clearable style="width: 180px" />
        </div>
        <div class="filter-item">
          <label class="filter-label">渠道</label>
          <t-select v-model="filterChannel" placeholder="全部" clearable style="width: 160px">
            <t-option value="" label="全部" />
            <t-option v-for="opt in channelOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </t-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">内容</label>
          <t-input v-model="filterContent" placeholder="请输入内容关键词" clearable style="width: 200px" />
        </div>
        <div class="btn-group">
          <t-button theme="primary" @click="handleSearch">搜索</t-button>
          <t-button theme="default" @click="handleReset">重置</t-button>
        </div>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="table-card">
      <t-table
        :data="templateList"
        :columns="columns"
        :loading="templateLoading"
        row-key="id"
        :hover="true"
        :stripe="false"
        :bordered="false"
        :pagination="{
          current: pageParams.pageNum,
          pageSize: pageParams.pageSize,
          total: templateTotal,
          pageSizeOptions: [20, 50, 100],
          showJumper: true
        }"
        :empty="templateTotal === 0 ? '暂无消息模板' : ''"
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <t-tag :theme="row.status === 'active' ? 'success' : 'default'" variant="light" size="small">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </t-tag>
        </template>
        <template #content="{ row }">
          <div class="content-ellipsis">{{ row.content }}</div>
        </template>
        <template #arrivalRate="{ row }">
          {{ getArrivalRate(row) }}
        </template>
        <template #row-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">详情</a>
        </template>
      </t-table>
    </div>

    <!-- 详情弹窗 -->
    <t-dialog v-model:visible="detailVisible" header="消息详情" width="560px" attach="body" :footer="true" :confirm-btn="null">
      <template #footer>
        <t-button theme="default" @click="detailVisible = false">关闭</t-button>
      </template>
      <div v-if="detailData" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">id</span>
          <span class="detail-value">{{ detailData.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">名称</span>
          <span class="detail-value">{{ detailData.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">产品线</span>
          <span class="detail-value">{{ detailData.productLine }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">场景</span>
          <span class="detail-value">{{ detailData.scene }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">渠道</span>
          <span class="detail-value">{{ detailData.channelName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span class="detail-value">
            <t-tag :theme="detailData.status === 'active' ? 'success' : 'default'" variant="light" size="small">
              {{ detailData.status === 'active' ? '启用' : '停用' }}
            </t-tag>
          </span>
        </div>
        <div class="detail-row detail-row--content">
          <span class="detail-label">内容</span>
          <div class="detail-text">{{ detailData.content }}</div>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建时间</span>
          <span class="detail-value">{{ detailData.createdAt }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">到达率</span>
          <span class="detail-value">{{ getArrivalRate(detailData) }}</span>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.message-template-page {
  padding: 24px;

  .filter-bar {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
    border: 1px solid var(--td-component-stroke);

    .filter-row {
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

      .btn-group {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
    }
  }

  .table-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .content-ellipsis {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  .detail-content {
    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px dashed var(--td-component-stroke);

      &.detail-row--content {
        flex-direction: column;
      }

      .detail-label {
        width: 80px;
        color: var(--td-text-color-secondary);
        font-size: 14px;
        flex-shrink: 0;
      }

      .detail-value {
        flex: 1;
        color: var(--td-text-color-primary);
        font-size: 14px;
      }

      .detail-text {
        background: var(--td-bg-color-secondarycontainer);
        padding: 12px;
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 13px;
        color: var(--td-text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}
</style>
