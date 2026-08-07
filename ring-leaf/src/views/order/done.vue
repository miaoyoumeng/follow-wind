<script setup lang="ts" name="DoneOrderList">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Tabs, TabPanel, Table, Select, Option, Input, Button, Tag, Dialog, DatePicker } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo, TableRowData } from 'tdesign-vue-next';

import { getRefundOrderListApi, getCompletedOrderListApi, getRefundOrderDetailApi, getCompletedOrderDetailApi } from '@/api/modules/completed-order';
import type { CompletedOrder } from '@/api/modules/completed-order';

/* ===== Tab 切换 ===== */
const activeTab = ref('refund');

/* ===== 筛选条件 ===== */
const refundFilter = ref({ appId: '', orderTimeRange: '', refundTimeRange: '', keyword: '' });
const completedFilter = ref({ appId: '', payMethod: '', completeTimeRange: '', keyword: '' });

/* ===== 列表数据 ===== */
const refundList = ref<CompletedOrder.RefundOrderItem[]>([]);
const completedList = ref<CompletedOrder.CompletedOrderItem[]>([]);

const refundTotal = ref(0);
const completedTotal = ref(0);

const refundSummary = ref<CompletedOrder.SummaryResult>({ orderCount: 0, totalAmount: 0 });
const paySummary = ref<CompletedOrder.SummaryResult>({ orderCount: 0, totalAmount: 0 });
const confirmSummary = ref<CompletedOrder.SummaryResult>({ orderCount: 0, totalAmount: 0 });
const refundCompletedSummary = ref<CompletedOrder.SummaryResult>({ orderCount: 0, totalAmount: 0 });

const loading = ref(false);

const refundPage = ref({ pageNum: 1, pageSize: 20 });
const completedPage = ref({ pageNum: 1, pageSize: 20 });

/* ===== 详情弹窗 ===== */
const refundDetailVisible = ref(false);
const refundDetailData = ref<CompletedOrder.RefundDetail | null>(null);

const completedDetailVisible = ref(false);
const completedDetailData = ref<CompletedOrder.CompletedDetail | null>(null);

/* ===== 表格列定义 ===== */
const refundColumns: PrimaryTableCol<TableRowData>[] = [
  { colKey: 'orderNo', title: '订单号', width: 180 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 100 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'skuName', title: 'SKU', width: 120 },
  { colKey: 'payAmount', title: '支付金额', width: 120, align: 'right' },
  { colKey: 'refundAmount', title: '退款金额', width: 120, align: 'right' },
  { colKey: 'refundReason', title: '退订原因', width: 120 },
  { colKey: 'refundTime', title: '退订时间', width: 160 },
  { colKey: 'row-operation', title: '操作', width: 80, fixed: 'right' }
];

const completedColumns: PrimaryTableCol<TableRowData>[] = [
  { colKey: 'orderNo', title: '订单号', width: 180 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 100 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'skuName', title: 'SKU', width: 120 },
  { colKey: 'payAmount', title: '支付金额', width: 120, align: 'right' },
  { colKey: 'confirmedAmount', title: '确收金额', width: 120, align: 'right' },
  { colKey: 'refundAmount', title: '退款金额', width: 120, align: 'right' },
  { colKey: 'completeTime', title: '完成时间', width: 160 },
  { colKey: 'row-operation', title: '操作', width: 80, fixed: 'right' }
];

/* ===== 金额格式化 ===== */
const formatAmount = (val: number) => {
  return '¥' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/* ===== 数据加载 ===== */
const loadRefundData = async () => {
  loading.value = true;
  try {
    const { data } = await getRefundOrderListApi({
      appId: refundFilter.value.appId || undefined,
      orderTimeRange: refundFilter.value.orderTimeRange || undefined,
      refundTimeRange: refundFilter.value.refundTimeRange || undefined,
      keyword: refundFilter.value.keyword || undefined,
      pageNum: refundPage.value.pageNum,
      pageSize: refundPage.value.pageSize
    });
    if (data) {
      refundList.value = data.list;
      refundTotal.value = data.total;
      refundSummary.value = data.summary;
    }
  } finally {
    loading.value = false;
  }
};

const loadCompletedData = async () => {
  loading.value = true;
  try {
    const { data } = await getCompletedOrderListApi({
      appId: completedFilter.value.appId || undefined,
      payMethod: completedFilter.value.payMethod || undefined,
      completeTimeRange: completedFilter.value.completeTimeRange || undefined,
      keyword: completedFilter.value.keyword || undefined,
      pageNum: completedPage.value.pageNum,
      pageSize: completedPage.value.pageSize
    });
    if (data) {
      completedList.value = data.list;
      completedTotal.value = data.total;
      paySummary.value = data.paySummary;
      confirmSummary.value = data.confirmSummary;
      refundCompletedSummary.value = data.refundSummary;
    }
  } finally {
    loading.value = false;
  }
};

/* ===== Tab 切换 ===== */
const handleTabChange = () => {
  if (activeTab.value === 'refund') loadRefundData();
  else if (activeTab.value === 'completed') loadCompletedData();
};

/* ===== 搜索与重置 ===== */
const handleRefundSearch = () => {
  refundPage.value.pageNum = 1;
  loadRefundData();
};

const handleRefundReset = () => {
  refundFilter.value = { appId: '', orderTimeRange: '', refundTimeRange: '', keyword: '' };
  refundPage.value.pageNum = 1;
  loadRefundData();
};

const handleCompletedSearch = () => {
  completedPage.value.pageNum = 1;
  loadCompletedData();
};

const handleCompletedReset = () => {
  completedFilter.value = { appId: '', payMethod: '', completeTimeRange: '', keyword: '' };
  completedPage.value.pageNum = 1;
  loadCompletedData();
};

/* ===== 分页 ===== */
const handleRefundPageChange = (pageInfo: PageInfo) => {
  refundPage.value.pageNum = pageInfo.current;
  refundPage.value.pageSize = pageInfo.pageSize;
  loadRefundData();
};

const handleCompletedPageChange = (pageInfo: PageInfo) => {
  completedPage.value.pageNum = pageInfo.current;
  completedPage.value.pageSize = pageInfo.pageSize;
  loadCompletedData();
};

/* ===== 详情查看 ===== */
const handleRefundDetail = async (row: CompletedOrder.RefundOrderItem) => {
  try {
    const { data } = await getRefundOrderDetailApi(row.id);
    if (data) {
      refundDetailData.value = data;
      refundDetailVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

const handleCompletedDetail = async (row: CompletedOrder.CompletedOrderItem) => {
  try {
    const { data } = await getCompletedOrderDetailApi(row.id);
    if (data) {
      completedDetailData.value = data;
      completedDetailVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadRefundData();
});
</script>

<template>
  <div class="done-order-page">
    <h2 class="page-title">完成订单列表</h2>

    <!-- Tab 切换 -->
    <Tabs v-model="activeTab" @change="handleTabChange">
      <TabPanel value="refund" label="退单" />
      <TabPanel value="completed" label="完成交易" />
    </Tabs>

    <!-- 退单 Tab -->
    <div v-show="activeTab === 'refund'">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">App</span>
          <Select v-model="refundFilter.appId" placeholder="全部App" clearable style="width: 160px">
            <Option value="" label="全部App" />
            <Option value="神笔马良" label="神笔马良" />
          </Select>
        </div>
        <div class="filter-item">
          <span class="filter-label">下单时间</span>
          <DatePicker v-model="refundFilter.orderTimeRange" mode="date" clearable style="width: 160px" />
        </div>
        <div class="filter-item">
          <span class="filter-label">退订时间</span>
          <DatePicker v-model="refundFilter.refundTimeRange" mode="date" clearable style="width: 160px" />
        </div>
        <div class="filter-item">
          <span class="filter-label">订单号/用户</span>
          <Input v-model="refundFilter.keyword" placeholder="请输入订单号或用户" clearable style="width: 200px" @enter="handleRefundSearch" />
        </div>
        <div class="btn-group">
          <Button theme="primary" @click="handleRefundSearch">搜索</Button>
          <Button theme="default" @click="handleRefundReset">重置</Button>
        </div>
      </div>

      <!-- 列表 -->
      <div class="table-card">
        <Table
          :data="refundList"
          :columns="refundColumns"
          :loading="loading"
          row-key="id"
          :hover="true"
          :stripe="false"
          :bordered="false"
          :pagination="{
            current: refundPage.pageNum,
            pageSize: refundPage.pageSize,
            total: refundTotal,
            pageSizeOptions: [20, 50, 100],
            showJumper: true
          }"
          :empty="refundTotal === 0 ? '暂无退订订单' : ''"
          @page-change="handleRefundPageChange"
        >
          <template #col-payAmount="{ row }">
            <span>{{ formatAmount(row.payAmount) }}</span>
          </template>
          <template #col-refundAmount="{ row }">
            <span class="amount-negative">{{ formatAmount(row.refundAmount) }}</span>
          </template>
          <template #col-refundReason="{ row }">
            <Tag theme="danger" variant="light" size="small">{{ row.refundReason }}</Tag>
          </template>
          <template #row-operation="{ row }">
            <a class="action-link" @click="handleRefundDetail(row)">详情</a>
          </template>
        </Table>
      </div>
    </div>

    <!-- 完成交易 Tab -->
    <div v-show="activeTab === 'completed'">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">App</span>
          <Select v-model="completedFilter.appId" placeholder="全部App" clearable style="width: 160px">
            <Option value="" label="全部App" />
            <Option value="神笔马良" label="神笔马良" />
          </Select>
        </div>
        <div class="filter-item">
          <span class="filter-label">支付方式</span>
          <Select v-model="completedFilter.payMethod" placeholder="全部方式" clearable style="width: 160px">
            <Option value="" label="全部方式" />
            <Option value="微信支付" label="微信支付" />
            <Option value="支付宝" label="支付宝" />
          </Select>
        </div>
        <div class="filter-item">
          <span class="filter-label">完成时间</span>
          <DatePicker v-model="completedFilter.completeTimeRange" mode="date" clearable style="width: 160px" />
        </div>
        <div class="filter-item">
          <span class="filter-label">订单号/用户</span>
          <Input v-model="completedFilter.keyword" placeholder="请输入订单号或用户" clearable style="width: 200px" @enter="handleCompletedSearch" />
        </div>
        <div class="btn-group">
          <Button theme="primary" @click="handleCompletedSearch">搜索</Button>
          <Button theme="default" @click="handleCompletedReset">重置</Button>
        </div>
      </div>

      <!-- 合计统计 -->
      <div class="summary-bar">
        <div class="summary-item">
          <div class="summary-label">支付金额合计</div>
          <div class="summary-value">{{ formatAmount(paySummary.totalAmount) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">确收金额合计</div>
          <div class="summary-value value-positive">{{ formatAmount(confirmSummary.totalAmount) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">退款金额合计</div>
          <div class="summary-value value-negative">{{ formatAmount(refundCompletedSummary.totalAmount) }}</div>
        </div>
      </div>

      <!-- 列表 -->
      <div class="table-card">
        <Table
          :data="completedList"
          :columns="completedColumns"
          :loading="loading"
          row-key="id"
          :hover="true"
          :stripe="false"
          :bordered="false"
          :pagination="{
            current: completedPage.pageNum,
            pageSize: completedPage.pageSize,
            total: completedTotal,
            pageSizeOptions: [20, 50, 100],
            showJumper: true
          }"
          :empty="completedTotal === 0 ? '暂无交易完成订单' : ''"
          @page-change="handleCompletedPageChange"
        >
          <template #col-payAmount="{ row }">
            <span>{{ formatAmount(row.payAmount) }}</span>
          </template>
          <template #col-confirmedAmount="{ row }">
            <span class="amount-positive">{{ formatAmount(row.confirmedAmount) }}</span>
          </template>
          <template #col-refundAmount="{ row }">
            <span class="amount-negative">{{ formatAmount(row.refundAmount) }}</span>
          </template>
          <template #row-operation="{ row }">
            <a class="action-link" @click="handleCompletedDetail(row)">详情</a>
          </template>
        </Table>
      </div>
    </div>

    <!-- 退单详情弹窗 -->
    <Dialog
      v-model:visible="refundDetailVisible"
      :header="'退单详情 - ' + (refundDetailData?.orderNo || '')"
      width="560px"
      attach="body"
      :footer="false"
    >
      <div v-if="refundDetailData" class="detail-content">
        <div class="detail-section-title">基本信息</div>
        <div class="detail-row">
          <span class="detail-label">订单号</span>
          <span class="detail-value">{{ refundDetailData.orderNo }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户ID</span>
          <span class="detail-value">{{ refundDetailData.userId }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户名称</span>
          <span class="detail-value">{{ refundDetailData.userName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">所属 App</span>
          <span class="detail-value">{{ refundDetailData.appName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SKU</span>
          <span class="detail-value">{{ refundDetailData.skuName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付方式</span>
          <span class="detail-value">{{ refundDetailData.payMethod }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付时间</span>
          <span class="detail-value">{{ refundDetailData.payTime }}</span>
        </div>

        <div class="detail-section-title">金额明细</div>
        <div class="detail-row">
          <span class="detail-label">支付金额</span>
          <span class="detail-value">{{ formatAmount(refundDetailData.payAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">已确收</span>
          <span class="detail-value">{{ formatAmount(refundDetailData.confirmedAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">退款金额</span>
          <span class="detail-value value-negative">{{ formatAmount(refundDetailData.refundAmount) }}</span>
        </div>

        <div class="detail-section-title">退订信息</div>
        <div class="detail-row">
          <span class="detail-label">退订原因</span>
          <span class="detail-value">{{ refundDetailData.refundReason }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">退订时间</span>
          <span class="detail-value">{{ refundDetailData.refundTime }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">审核人</span>
          <span class="detail-value">{{ refundDetailData.reviewer }}</span>
        </div>
      </div>
      <div class="detail-footer">
        <Button theme="primary" @click="refundDetailVisible = false">关闭</Button>
      </div>
    </Dialog>

    <!-- 完成交易详情弹窗 -->
    <Dialog v-model:visible="completedDetailVisible" header="订单详情 - 交易完成" width="640px" attach="body" :footer="false">
      <div v-if="completedDetailData" class="detail-content">
        <div class="detail-section-title">基本信息</div>
        <div class="detail-row">
          <span class="detail-label">订单号</span>
          <span class="detail-value">{{ completedDetailData.orderNo }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户ID</span>
          <span class="detail-value">{{ completedDetailData.userId }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户名称</span>
          <span class="detail-value">{{ completedDetailData.userName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">所属 App</span>
          <span class="detail-value">{{ completedDetailData.appName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SKU</span>
          <span class="detail-value">{{ completedDetailData.skuName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付方式</span>
          <span class="detail-value">{{ completedDetailData.payMethod }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付时间</span>
          <span class="detail-value">{{ completedDetailData.payTime }}</span>
        </div>

        <div class="detail-section-title">金额明细</div>
        <div class="detail-row">
          <span class="detail-label">支付金额</span>
          <span class="detail-value">{{ formatAmount(completedDetailData.payAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">确收金额</span>
          <span class="detail-value value-positive">{{ formatAmount(completedDetailData.confirmedAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">退款金额</span>
          <span class="detail-value">{{ formatAmount(completedDetailData.refundAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">优惠券抵扣</span>
          <span class="detail-value">{{ formatAmount(completedDetailData.couponDeduction) }}</span>
        </div>

        <div class="detail-section-title">确收记录</div>
        <div v-if="completedDetailData.confirmRecords.length > 0" class="detail-table-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>确收金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in completedDetailData.confirmRecords" :key="record.date">
                <td>{{ record.date }}</td>
                <td>{{ formatAmount(record.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">暂无确收记录</div>

        <div class="detail-section-title">退款记录</div>
        <div v-if="completedDetailData.refundRecords.length > 0" class="detail-table-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>退款金额</th>
                <th>退款原因</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in completedDetailData.refundRecords" :key="record.date">
                <td>{{ record.date }}</td>
                <td class="amount-negative">{{ formatAmount(record.amount) }}</td>
                <td>{{ record.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">无退款记录</div>
      </div>
      <div class="detail-footer">
        <Button theme="primary" @click="completedDetailVisible = false">关闭</Button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.done-order-page {
  padding: 24px;

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin-bottom: 24px;
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

  .summary-bar {
    display: flex;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 16px;
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    .summary-item {
      flex: 1;

      .summary-label {
        font-size: 13px;
        color: var(--td-text-color-secondary);
        margin-bottom: 4px;
      }

      .summary-value {
        font-size: 20px;
        font-weight: 600;
        color: var(--td-text-color-primary);
      }
    }

    .value-positive {
      color: var(--td-success-color);
    }

    .value-negative {
      color: var(--td-error-color);
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
