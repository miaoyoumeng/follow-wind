<script setup lang="ts" name="ExecutionOrderList">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Table, Select, Option, Input, Button, Tag, Dialog, DatePicker, Progress } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo, TableRowData } from 'tdesign-vue-next';

import { getFulfillingOrderListApi, getFulfillingOrderDetailApi } from '@/api/modules/fulfilling-order';
import type { FulfillingOrder } from '@/api/modules/fulfilling-order';

/* ===== 筛选条件 ===== */
const filter = ref({ appId: '', confirmStatus: '', orderTimeRange: '', keyword: '' });

/* ===== 列表数据 ===== */
const list = ref<FulfillingOrder.FulfillingOrderItem[]>([]);
const total = ref(0);
const summary = ref<FulfillingOrder.SummaryResult>({ orderCount: 0, totalAmount: 0, confirmedAmount: 0 });
const loading = ref(false);
const page = ref({ pageNum: 1, pageSize: 20 });

/* ===== 详情弹窗 ===== */
const detailVisible = ref(false);
const detailData = ref<FulfillingOrder.Detail | null>(null);

/* ===== 表格列定义 ===== */
const columns: PrimaryTableCol<TableRowData>[] = [
  { colKey: 'orderNo', title: '订单号', width: 180 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名', width: 100 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'skuName', title: 'SKU', width: 120 },
  { colKey: 'payAmount', title: '订单金额', width: 120, align: 'right' },
  { colKey: 'confirmedAmount', title: '已确收', width: 120, align: 'right' },
  { colKey: 'orderTime', title: '下单时间', width: 160 },
  { colKey: 'expireTime', title: '到期时间', width: 160 },
  { colKey: 'confirmStatus', title: '状态', width: 100 },
  { colKey: 'row-operation', title: '操作', width: 120, fixed: 'right' }
];

/* ===== 金额格式化 ===== */
const formatAmount = (val: number) => {
  return '¥' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/* ===== 状态标签主题 ===== */
const getStatusTheme = (status: FulfillingOrder.ConfirmStatus) => {
  return status === 'confirming' ? 'success' : 'warning';
};

/* ===== 数据加载 ===== */
const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getFulfillingOrderListApi({
      appId: filter.value.appId || undefined,
      confirmStatus: (filter.value.confirmStatus as FulfillingOrder.ConfirmStatus) || undefined,
      orderTimeRange: filter.value.orderTimeRange || undefined,
      keyword: filter.value.keyword || undefined,
      pageNum: page.value.pageNum,
      pageSize: page.value.pageSize
    });
    if (data) {
      list.value = data.list;
      total.value = data.total;
      summary.value = data.summary;
    }
  } finally {
    loading.value = false;
  }
};

/* ===== 搜索与重置 ===== */
const handleSearch = () => {
  page.value.pageNum = 1;
  loadData();
};

const handleReset = () => {
  filter.value = { appId: '', confirmStatus: '', orderTimeRange: '', keyword: '' };
  page.value.pageNum = 1;
  loadData();
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  page.value.pageNum = pageInfo.current;
  page.value.pageSize = pageInfo.pageSize;
  loadData();
};

/* ===== 详情查看 ===== */
const handleDetail = async (row: FulfillingOrder.FulfillingOrderItem) => {
  try {
    const { data } = await getFulfillingOrderDetailApi(row.id);
    if (data) {
      detailData.value = data;
      detailVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="execution-order-page">
    <h2 class="page-title">在履约订单列表</h2>

    <!-- 合计统计卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-label">在履约订单数</div>
        <div class="summary-value">{{ summary.orderCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">在履约总金额</div>
        <div class="summary-value value-primary">{{ formatAmount(summary.totalAmount) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">已确收金额</div>
        <div class="summary-value value-positive">{{ formatAmount(summary.confirmedAmount) }}</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">App 筛选</span>
        <Select v-model="filter.appId" placeholder="全部App" clearable style="width: 160px">
          <Option value="" label="全部App" />
          <Option value="神笔马良" label="神笔马良" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">确收状态</span>
        <Select v-model="filter.confirmStatus" placeholder="全部状态" clearable style="width: 160px">
          <Option value="" label="全部状态" />
          <Option value="confirming" label="确收中" />
          <Option value="expiring" label="即将到期" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">下单时间</span>
        <DatePicker v-model="filter.orderTimeRange" mode="date" placeholder="选择日期" clearable style="width: 160px" />
      </div>
      <div class="filter-item">
        <span class="filter-label">订单号/用户ID</span>
        <Input v-model="filter.keyword" placeholder="请输入订单号或用户ID" clearable style="width: 200px" @enter="handleSearch" />
      </div>
      <div class="btn-group">
        <Button theme="primary" @click="handleSearch">搜索</Button>
        <Button theme="default" @click="handleReset">重置</Button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-card">
      <Table
        :data="list"
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
        :empty="total === 0 ? '暂无在履约订单' : ''"
        @page-change="handlePageChange"
      >
        <template #col-payAmount="{ row }">
          <span>{{ formatAmount(row.payAmount) }}</span>
        </template>
        <template #col-confirmedAmount="{ row }">
          <span class="amount-positive">{{ formatAmount(row.confirmedAmount) }}</span>
        </template>
        <template #col-confirmStatus="{ row }">
          <Tag :theme="getStatusTheme(row.confirmStatus)" variant="light" size="small">
            {{ row.confirmStatusName }}
          </Tag>
        </template>
        <template #row-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">详情</a>
          <a class="action-link">备注</a>
        </template>
      </Table>
    </div>

    <!-- 订单详情弹窗 -->
    <Dialog
      v-model:visible="detailVisible"
      :header="'订单详情 - 在履约 - ' + (detailData?.orderNo || '')"
      width="600px"
      attach="body"
      :footer="false"
    >
      <div v-if="detailData" class="detail-content">
        <div class="detail-section-title">基本信息</div>
        <div class="detail-row">
          <span class="detail-label">订单号</span>
          <span class="detail-value">{{ detailData.orderNo }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户</span>
          <span class="detail-value">{{ detailData.userName }}（{{ detailData.phone }}）</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">所属 App</span>
          <span class="detail-value">{{ detailData.appName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SKU</span>
          <span class="detail-value">{{ detailData.skuName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付方式</span>
          <span class="detail-value">{{ detailData.payMethod }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付时间</span>
          <span class="detail-value">{{ detailData.payTime }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SKU 到期时间</span>
          <span class="detail-value">{{ detailData.expireTime }}</span>
        </div>

        <div class="detail-section-title">金额明细</div>
        <div class="detail-row">
          <span class="detail-label">支付金额</span>
          <span class="detail-value">{{ formatAmount(detailData.payAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">已确收</span>
          <span class="detail-value value-positive">{{ formatAmount(detailData.confirmedAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">待确收</span>
          <span class="detail-value value-negative">{{ formatAmount(detailData.payAmount - detailData.confirmedAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">确收进度</span>
          <span class="detail-value">
            <Progress theme="line" :percentage="detailData.confirmProgress" :label="true" size="small" style="width: 200px" />
          </span>
        </div>

        <div class="detail-section-title">确收记录</div>
        <div v-if="detailData.confirmRecords.length > 0" class="detail-table-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>确收金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in detailData.confirmRecords" :key="record.date">
                <td>{{ record.date }}</td>
                <td class="amount-positive">{{ formatAmount(record.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">暂无确收记录</div>
      </div>
      <div class="detail-footer">
        <Button theme="primary" @click="detailVisible = false">关闭</Button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.execution-order-page {
  padding: 24px;

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin-bottom: 24px;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .summary-card {
      background: var(--td-bg-color-container);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      .summary-label {
        font-size: 14px;
        color: var(--td-text-color-secondary);
        margin-bottom: 8px;
      }

      .summary-value {
        font-size: 28px;
        font-weight: 600;
      }

      .value-primary {
        color: var(--td-brand-color);
      }

      .value-positive {
        color: var(--td-success-color);
      }
    }
  }

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

    .btn-group {
      display: flex;
      gap: 8px;
      margin-left: auto;
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

  .amount-positive {
    color: var(--td-success-color);
    font-weight: 500;
  }

  .amount-negative {
    color: var(--td-error-color);
    font-weight: 500;
  }

  .detail-content {
    .detail-section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      margin-bottom: 12px;
      margin-top: 16px;
      padding-left: 10px;
      border-left: 3px solid var(--td-brand-color);

      &:first-child {
        margin-top: 0;
      }
    }

    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px dashed var(--td-component-stroke);
      align-items: center;

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        width: 120px;
        color: var(--td-text-color-secondary);
        font-size: 14px;
        flex-shrink: 0;
      }

      .detail-value {
        flex: 1;
        color: var(--td-text-color-primary);
        font-size: 14px;
      }

      .value-positive {
        color: var(--td-success-color);
      }

      .value-negative {
        color: var(--td-error-color);
      }
    }

    .detail-table-wrapper {
      margin-top: 8px;

      .detail-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;

        th,
        td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--td-component-stroke);
          text-align: left;
        }

        th {
          background: var(--td-bg-color-container-hover);
          color: var(--td-text-color-secondary);
          font-weight: 500;
        }
      }
    }

    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--td-text-color-secondary);
      font-size: 14px;
    }
  }

  .detail-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-stroke);
    margin-top: 16px;
    gap: 8px;
  }
}
</style>
