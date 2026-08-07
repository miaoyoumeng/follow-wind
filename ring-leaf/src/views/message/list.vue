<script setup lang="ts" name="MessageList">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Button, Table, Select, Option, Tag, Dialog, Input } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import { getMessageListApi, getMessageDetailApi, getMessageChannelOptionsApi } from '@/api/message.ts';
import type { MessageRecord } from '@/api/modules/message.ts';

/* ===== 列表数据 ===== */
const messageList = ref<MessageRecord.MessageItem[]>([]);
const messageTotal = ref(0);
const messageLoading = ref(false);
const pageParams = ref({ pageNum: 1, pageSize: 20 });

/* ===== 筛选条件 ===== */
const filterUserId = ref('');
const filterChannel = ref<MessageRecord.ChannelType | ''>('');
const filterContent = ref('');

/* ===== 渠道选项 ===== */
const channelOptions = ref<MessageRecord.ChannelOption[]>([]);

/* ===== 详情弹窗 ===== */
const detailVisible = ref(false);
const detailData = ref<MessageRecord.MessageItem | null>(null);

/* ===== 表格列定义 ===== */
const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'id', width: 60 },
  { colKey: 'userId', title: '用户id', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 100 },
  { colKey: 'templateId', title: '消息模板id', width: 120 },
  { colKey: 'content', title: '消息内容', ellipsis: true, width: 240 },
  { colKey: 'channelName', title: '渠道', width: 100 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'sentAt', title: '发送时间', width: 180 },
  { colKey: 'row-operation', title: '操作', width: 80, fixed: 'right' }
];

/* ===== 数据加载 ===== */
const loadData = async () => {
  messageLoading.value = true;
  try {
    const { data } = await getMessageListApi({
      userId: filterUserId.value || undefined,
      channel: filterChannel.value || undefined,
      content: filterContent.value || undefined,
      pageNum: pageParams.value.pageNum,
      pageSize: pageParams.value.pageSize
    });
    if (data) {
      messageList.value = data.list;
      messageTotal.value = data.total;
    }
  } finally {
    messageLoading.value = false;
  }
};

const loadChannelOptions = async () => {
  const { data } = await getMessageChannelOptionsApi();
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
  filterUserId.value = '';
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
const handleDetail = async (row: MessageRecord.MessageItem) => {
  try {
    const { data } = await getMessageDetailApi({ id: row.id });
    if (data) {
      detailData.value = data;
      detailVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 状态标签主题 ===== */
const getStatusTheme = (status: MessageRecord.Status) => {
  const themeMap: Record<MessageRecord.Status, 'success' | 'warning' | 'danger'> = {
    delivered: 'success',
    sending: 'warning',
    failed: 'danger'
  };
  return themeMap[status] || 'default';
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadChannelOptions();
  loadData();
});
</script>

<template>
  <div class="message-list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">消息列表</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">用户id</label>
          <Input v-model="filterUserId" placeholder="请输入用户id" clearable style="width: 160px" />
        </div>
        <div class="filter-item">
          <label class="filter-label">渠道</label>
          <Select v-model="filterChannel" placeholder="全部" clearable style="width: 160px">
            <Option value="" label="全部" />
            <Option v-for="opt in channelOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </Select>
        </div>
        <div class="filter-item">
          <label class="filter-label">消息内容</label>
          <Input v-model="filterContent" placeholder="请输入内容关键词" clearable style="width: 200px" />
        </div>
        <div class="btn-group">
          <Button theme="primary" @click="handleSearch">搜索</Button>
          <Button theme="default" @click="handleReset">重置</Button>
        </div>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="table-card">
      <Table
        :data="messageList"
        :columns="columns"
        :loading="messageLoading"
        row-key="id"
        :hover="true"
        :stripe="false"
        :bordered="false"
        :pagination="{
          current: pageParams.pageNum,
          pageSize: pageParams.pageSize,
          total: messageTotal,
          pageSizeOptions: [20, 50, 100],
          showJumper: true
        }"
        :empty="messageTotal === 0 ? '暂无消息记录' : ''"
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <Tag :theme="getStatusTheme(row.status)" variant="light" size="small">
            {{ row.statusName }}
          </Tag>
        </template>
        <template #row-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">详情</a>
        </template>
      </Table>
    </div>

    <!-- 详情弹窗 -->
    <Dialog v-model:visible="detailVisible" header="消息详情" width="520px" attach="body" :footer="false">
      <div v-if="detailData" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">id</span>
          <span class="detail-value">{{ detailData.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户id</span>
          <span class="detail-value">{{ detailData.userId }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户名称</span>
          <span class="detail-value">{{ detailData.userName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">消息模板id</span>
          <span class="detail-value">{{ detailData.templateId }}</span>
        </div>
        <div class="detail-row detail-content-row">
          <span class="detail-label">消息内容</span>
          <div class="detail-text">{{ detailData.content }}</div>
        </div>
        <div class="detail-row">
          <span class="detail-label">渠道</span>
          <span class="detail-value">{{ detailData.channelName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span class="detail-value">
            <Tag :theme="getStatusTheme(detailData.status)" variant="light" size="small">
              {{ detailData.statusName }}
            </Tag>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">发送时间</span>
          <span class="detail-value">{{ detailData.sentAt }}</span>
        </div>
      </div>
      <div class="detail-footer">
        <Button theme="default" @click="detailVisible = false">关闭</Button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.message-list-page {
  padding: 24px;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

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

  .action-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;
    margin-right: 12px;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }

  .detail-content {
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px dashed var(--td-component-stroke);

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        width: 100px;
        color: var(--td-text-color-secondary);
        font-size: 14px;
        flex-shrink: 0;
      }

      .detail-value {
        flex: 1;
        color: var(--td-text-color-primary);
        font-size: 14px;
      }

      &.detail-content-row {
        flex-direction: column;
        gap: 6px;

        .detail-text {
          background: var(--td-bg-color-container);
          padding: 12px;
          border-radius: 4px;
          white-space: pre-wrap;
          word-break: break-all;
          font-size: 13px;
          color: var(--td-text-color-secondary);
        }
      }
    }
  }

  .detail-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-stroke);
    margin-top: 16px;
  }
}
</style>
