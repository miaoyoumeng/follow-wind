<template>
  <div class="transaction-flow-page">
    <h1 class="page-title">交易流水</h1>

    <!-- 摘要卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-label">今日收入笔数</div>
        <div class="summary-value">{{ summary.todayPayCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">今日收入金额</div>
        <div class="summary-value">&yen;{{ formatAmount(summary.todayPayAmount) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">今日退款金额</div>
        <div class="summary-value refund-value">&yen;{{ formatAmount(summary.todayRefundAmount) }}</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">App 筛选</span>
        <t-select v-model="filterApp" placeholder="全部" clearable style="width: 160px">
          <t-option value="" label="全部" />
          <t-option value="shenbi" label="神笔马良" />
          <t-option value="app-b" label="App B" />
        </t-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">交易类型</span>
        <t-select v-model="filterTxType" placeholder="全部" clearable style="width: 160px">
          <t-option value="" label="全部" />
          <t-option value="pay" label="支付" />
          <t-option value="refund" label="退款" />
        </t-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">支付渠道</span>
        <t-select v-model="filterChannel" placeholder="全部" clearable style="width: 160px">
          <t-option value="" label="全部" />
          <t-option value="wechat" label="微信支付" />
          <t-option value="alipay" label="支付宝" />
        </t-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">交易时间</span>
        <t-date-picker v-model="filterDate" placeholder="选择日期" style="width: 160px" />
      </div>
      <div class="filter-item">
        <span class="filter-label">订单号/用户</span>
        <t-input v-model="filterKeyword" placeholder="请输入订单号或用户名" clearable style="width: 200px" />
      </div>
      <div class="filter-actions">
        <t-button theme="primary" variant="base" size="small" @click="handleSearch">搜索</t-button>
        <t-button theme="default" variant="base" size="small" @click="handleReset">重置</t-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        :hover="true"
        :stripe="false"
        :bordered="false"
        :loading="loading"
        :pagination="{ current: pageNum, pageSize, total, showJumper: true, showPageSize: true }"
        :page-size-options="[20, 50, 100]"
        @page-change="handlePageChange"
      >
        <template #col-txType="{ row }">
          <span :class="row.txType === 'pay' ? 'type-pay' : 'type-refund'">
            {{ row.txType === 'pay' ? '支付' : '退款' }}
          </span>
        </template>
        <template #col-amount="{ row }">
          <span :class="row.txType === 'pay' ? 'type-pay' : 'type-refund'">
            {{ row.txType === 'pay' ? '+' : '-' }}&yen;{{ formatAmount(row.amount) }}
          </span>
        </template>
        <template #col-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">详情</a>
        </template>
      </t-table>
    </div>

    <!-- 详情弹窗 -->
    <t-dialog v-model:visible="detailVisible" header="流水详情" width="480px" attach="body" :footer="false">
      <template v-if="detailData">
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">流水号</span>
            <span class="detail-value">{{ detailData.flowNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">订单号</span>
            <span class="detail-value">{{ detailData.orderNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">用户</span>
            <span class="detail-value">{{ detailData.userName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">流水类型</span>
            <span class="detail-value" :class="detailData.txType === 'pay' ? 'type-pay' : 'type-refund'">
              {{ detailData.txTypeName }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">金额</span>
            <span class="detail-value" :class="detailData.txType === 'pay' ? 'type-pay' : 'type-refund'">
              &yen;{{ formatAmount(detailData.amount) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">支付方式</span>
            <span class="detail-value">{{ detailData.channelName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">时间</span>
            <span class="detail-value">{{ detailData.txTime }}</span>
          </div>
        </div>
        <div class="detail-footer">
          <t-button theme="default" variant="base" @click="detailVisible = false">关闭</t-button>
        </div>
      </template>
    </t-dialog>
  </div>
</template>

<script setup lang="ts" name="TransactionFlow">
import { ref, onMounted } from 'vue';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import type { TransactionFlow } from '@/api/modules/transaction-flow';
import { getTransactionFlowListApi, getTransactionFlowSummaryApi, getTransactionFlowDetailApi } from '@/api/modules/transaction-flow';

/* ===== 摘要数据 ===== */
const summary = ref({
  todayPayCount: 0,
  todayPayAmount: 0,
  todayRefundAmount: 0
});

const loadSummary = async () => {
  try {
    const { data } = await getTransactionFlowSummaryApi();
    summary.value = data;
  } catch {
    summary.value = { todayPayCount: 0, todayPayAmount: 0, todayRefundAmount: 0 };
  }
};

/* ===== 筛选条件 ===== */
const filterApp = ref('');
const filterTxType = ref<TransactionFlow.TxType | ''>('');
const filterChannel = ref<TransactionFlow.Channel | ''>('');
const filterDate = ref<string>('');
const filterKeyword = ref<string>('');

const handleSearch = () => {
  pageNum.value = 1;
  loadTableData();
};

const handleReset = () => {
  filterApp.value = '';
  filterTxType.value = '';
  filterChannel.value = '';
  filterDate.value = '';
  filterKeyword.value = '';
  pageNum.value = 1;
  loadTableData();
};

/* ===== 列表数据 ===== */
const loading = ref(false);
const tableData = ref<TransactionFlow.FlowItem[]>([]);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

const loadTableData = async () => {
  loading.value = true;
  try {
    const params: TransactionFlow.ListParams = {
      appId: filterApp.value || undefined,
      txType: filterTxType.value || undefined,
      channel: filterChannel.value || undefined,
      date: filterDate.value || undefined,
      keyword: filterKeyword.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    };
    const { data } = await getTransactionFlowListApi(params);
    tableData.value = data.list;
    total.value = data.total;
  } catch {
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (pageInfo: PageInfo) => {
  pageNum.value = pageInfo.current ?? 1;
  pageSize.value = pageInfo.pageSize ?? 20;
  loadTableData();
};

/* ===== 列定义 ===== */
const columns: PrimaryTableCol<TransactionFlow.FlowItem>[] = [
  { colKey: 'flowNo', title: '流水号', width: 180 },
  { colKey: 'orderNo', title: '关联订单号', width: 180 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'txType', title: '交易类型', width: 100 },
  { colKey: 'amount', title: '金额', width: 120 },
  { colKey: 'channelName', title: '支付渠道', width: 100 },
  { colKey: 'txTime', title: '交易时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 80, fixed: 'right' }
];

/* ===== 详情弹窗 ===== */
const detailVisible = ref(false);
const detailData = ref<TransactionFlow.FlowDetail | null>(null);

const handleDetail = async (row: TransactionFlow.FlowItem) => {
  try {
    const { data } = await getTransactionFlowDetailApi(row.id);
    detailData.value = data;
    detailVisible.value = true;
  } catch {
    MessagePlugin.error('获取流水详情失败');
  }
};

/* ===== 工具方法 ===== */
const formatAmount = (val: number) => {
  return val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadSummary();
  loadTableData();
});
</script>

<style scoped lang="scss">
.transaction-flow-page {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
    margin-bottom: 24px;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .summary-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      .summary-label {
        font-size: 14px;
        color: #8f929e;
        margin-bottom: 8px;
      }

      .summary-value {
        font-size: 28px;
        font-weight: 600;
        color: #0052d9;

        &.refund-value {
          color: #f53f3f;
        }
      }
    }
  }

  .filter-bar {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .filter-label {
        font-size: 12px;
        color: #8f929e;
      }
    }

    .filter-actions {
      display: flex;
      gap: 8px;
    }
  }

  .table-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
}

.type-pay {
  color: #00b42a;
}

.type-refund {
  color: #f53f3f;
}

.action-link {
  color: #0052d9;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
}

.detail-grid {
  .detail-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      width: 100px;
      color: #8f929e;
      font-size: 14px;
      flex-shrink: 0;
    }

    .detail-value {
      flex: 1;
      color: #1d2129;
      font-size: 14px;
    }
  }
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
