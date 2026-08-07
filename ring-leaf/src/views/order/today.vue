<script setup lang="ts" name="TodayOrder">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Tabs, TabPanel, Table, Select, Option, Input, Button, Tag, Dialog, DatePicker, Textarea } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo, TableRowData } from 'tdesign-vue-next';

import {
  getTodayPaidOrderListApi,
  getTodayUnpaidOrderListApi,
  getTodayRefundOrderListApi,
  getTodayPaidOrderDetailApi,
  getTodayUnpaidOrderDetailApi,
  getTodayRefundOrderDetailApi,
  getOrderNotesApi,
  addOrderNoteApi
} from '@/api/modules/today-order';
import type { TodayOrder } from '@/api/modules/today-order';

/* ===== Tab 切换 ===== */
const activeTab = ref('paid');

/* ===== 筛选条件 ===== */
const paidFilter = ref({ appId: '', dateRange: '', keyword: '' });
const unpaidFilter = ref({ appId: '', unpaidStatus: '', keyword: '' });
const refundFilter = ref({ appId: '', dateRange: '', keyword: '' });

/* ===== 列表数据 ===== */
const paidList = ref<TodayOrder.PaidOrderItem[]>([]);
const unpaidList = ref<TodayOrder.UnpaidOrderItem[]>([]);
const refundList = ref<TodayOrder.RefundOrderItem[]>([]);

const paidTotal = ref(0);
const unpaidTotal = ref(0);
const refundTotal = ref(0);

const paidSummary = ref<TodayOrder.SummaryResult>({ orderCount: 0, totalAmount: 0 });
const unpaidSummary = ref<TodayOrder.SummaryResult>({ orderCount: 0, totalAmount: 0 });
const refundSummary = ref<TodayOrder.SummaryResult>({ orderCount: 0, totalAmount: 0 });

const loading = ref(false);

const paidPage = ref({ pageNum: 1, pageSize: 20 });
const unpaidPage = ref({ pageNum: 1, pageSize: 20 });
const refundPage = ref({ pageNum: 1, pageSize: 20 });

/* ===== 详情弹窗 ===== */
const paidDetailVisible = ref(false);
const paidDetailData = ref<TodayOrder.PaidDetail | null>(null);

const unpaidDetailVisible = ref(false);
const unpaidDetailData = ref<TodayOrder.UnpaidDetail | null>(null);

const refundDetailVisible = ref(false);
const refundDetailData = ref<TodayOrder.RefundDetail | null>(null);

/* ===== 备注弹窗 ===== */
const noteVisible = ref(false);
const noteOrderNo = ref('');
const noteList = ref<TodayOrder.NoteItem[]>([]);
const noteInput = ref('');
const noteCharCount = ref(0);

/* ===== 表格列定义 ===== */
const paidColumns: PrimaryTableCol<TableRowData>[] = [
  { colKey: 'orderNo', title: '订单号', width: 180 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名', width: 100 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'skuName', title: 'SKU', width: 120 },
  { colKey: 'payAmount', title: '支付金额', width: 120, align: 'right' },
  { colKey: 'payMethod', title: '支付方式', width: 100 },
  { colKey: 'orderTime', title: '下单时间', width: 180 },
  { colKey: 'row-operation', title: '操作', width: 120, fixed: 'right' }
];

const unpaidColumns: PrimaryTableCol<TableRowData>[] = [
  { colKey: 'orderNo', title: '订单号', width: 180 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名', width: 100 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'skuName', title: 'SKU', width: 120 },
  { colKey: 'orderAmount', title: '订单金额', width: 120, align: 'right' },
  { colKey: 'unpaidStatus', title: '未支付状态', width: 120 },
  { colKey: 'orderTime', title: '下单时间', width: 160 },
  { colKey: 'expireTime', title: '超时时间', width: 160 },
  { colKey: 'row-operation', title: '操作', width: 120, fixed: 'right' }
];

const refundColumns: PrimaryTableCol<TableRowData>[] = [
  { colKey: 'orderNo', title: '订单号', width: 180 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名', width: 100 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'skuName', title: 'SKU', width: 120 },
  { colKey: 'payAmount', title: '支付金额', width: 120, align: 'right' },
  { colKey: 'refundAmount', title: '退款金额', width: 120, align: 'right' },
  { colKey: 'refundReason', title: '退订原因', width: 120 },
  { colKey: 'refundTime', title: '退订时间', width: 160 },
  { colKey: 'row-operation', title: '操作', width: 120, fixed: 'right' }
];

/* ===== 金额格式化 ===== */
const formatAmount = (val: number) => {
  return '¥' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/* ===== 数据加载 ===== */
const loadPaidData = async () => {
  loading.value = true;
  try {
    const { data } = await getTodayPaidOrderListApi({
      appId: paidFilter.value.appId || undefined,
      dateRange: paidFilter.value.dateRange || undefined,
      keyword: paidFilter.value.keyword || undefined,
      pageNum: paidPage.value.pageNum,
      pageSize: paidPage.value.pageSize
    });
    if (data) {
      paidList.value = data.list;
      paidTotal.value = data.total;
      paidSummary.value = data.summary;
    }
  } finally {
    loading.value = false;
  }
};

const loadUnpaidData = async () => {
  loading.value = true;
  try {
    const { data } = await getTodayUnpaidOrderListApi({
      appId: unpaidFilter.value.appId || undefined,
      unpaidStatus: (unpaidFilter.value.unpaidStatus as TodayOrder.UnpaidStatus) || undefined,
      keyword: unpaidFilter.value.keyword || undefined,
      pageNum: unpaidPage.value.pageNum,
      pageSize: unpaidPage.value.pageSize
    });
    if (data) {
      unpaidList.value = data.list;
      unpaidTotal.value = data.total;
      unpaidSummary.value = data.summary;
    }
  } finally {
    loading.value = false;
  }
};

const loadRefundData = async () => {
  loading.value = true;
  try {
    const { data } = await getTodayRefundOrderListApi({
      appId: refundFilter.value.appId || undefined,
      dateRange: refundFilter.value.dateRange || undefined,
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

/* ===== Tab 切换 ===== */
const handleTabChange = () => {
  if (activeTab.value === 'paid') loadPaidData();
  else if (activeTab.value === 'unpaid') loadUnpaidData();
  else if (activeTab.value === 'refund') loadRefundData();
};

/* ===== 搜索与重置 ===== */
const handlePaidSearch = () => {
  paidPage.value.pageNum = 1;
  loadPaidData();
};

const handlePaidReset = () => {
  paidFilter.value = { appId: '', dateRange: '', keyword: '' };
  paidPage.value.pageNum = 1;
  loadPaidData();
};

const handleUnpaidSearch = () => {
  unpaidPage.value.pageNum = 1;
  loadUnpaidData();
};

const handleUnpaidReset = () => {
  unpaidFilter.value = { appId: '', unpaidStatus: '', keyword: '' };
  unpaidPage.value.pageNum = 1;
  loadUnpaidData();
};

const handleRefundSearch = () => {
  refundPage.value.pageNum = 1;
  loadRefundData();
};

const handleRefundReset = () => {
  refundFilter.value = { appId: '', dateRange: '', keyword: '' };
  refundPage.value.pageNum = 1;
  loadRefundData();
};

/* ===== 分页 ===== */
const handlePaidPageChange = (pageInfo: PageInfo) => {
  paidPage.value.pageNum = pageInfo.current;
  paidPage.value.pageSize = pageInfo.pageSize;
  loadPaidData();
};

const handleUnpaidPageChange = (pageInfo: PageInfo) => {
  unpaidPage.value.pageNum = pageInfo.current;
  unpaidPage.value.pageSize = pageInfo.pageSize;
  loadUnpaidData();
};

const handleRefundPageChange = (pageInfo: PageInfo) => {
  refundPage.value.pageNum = pageInfo.current;
  refundPage.value.pageSize = pageInfo.pageSize;
  loadRefundData();
};

/* ===== 详情查看 ===== */
const handlePaidDetail = async (row: TodayOrder.PaidOrderItem) => {
  try {
    const { data } = await getTodayPaidOrderDetailApi(row.id);
    if (data) {
      paidDetailData.value = data;
      paidDetailVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

const handleUnpaidDetail = async (row: TodayOrder.UnpaidOrderItem) => {
  try {
    const { data } = await getTodayUnpaidOrderDetailApi(row.id);
    if (data) {
      unpaidDetailData.value = data;
      unpaidDetailVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

const handleRefundDetail = async (row: TodayOrder.RefundOrderItem) => {
  try {
    const { data } = await getTodayRefundOrderDetailApi(row.id);
    if (data) {
      refundDetailData.value = data;
      refundDetailVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 备注 ===== */
const handleNote = async (row: TodayOrder.PaidOrderItem | TodayOrder.UnpaidOrderItem | TodayOrder.RefundOrderItem) => {
  noteOrderNo.value = row.orderNo;
  noteInput.value = '';
  noteCharCount.value = 0;
  try {
    const { data } = await getOrderNotesApi(row.orderNo);
    if (data) {
      noteList.value = data.list;
    }
  } catch {
    noteList.value = [];
  }
  noteVisible.value = true;
};

const handleAddNote = async () => {
  const content = noteInput.value.trim();
  if (!content) {
    MessagePlugin.warning('请输入备注内容');
    return;
  }
  if (content.length > 500) {
    MessagePlugin.warning('备注内容不能超过500字');
    return;
  }
  try {
    const { data } = await addOrderNoteApi({ orderNo: noteOrderNo.value, content });
    if (data) {
      noteList.value.unshift(data);
      noteInput.value = '';
      noteCharCount.value = 0;
      MessagePlugin.success('备注已添加');
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

const handleNoteInput = (val: string | number) => {
  noteCharCount.value = String(val).length;
};

/* ===== 未支付状态标签主题 ===== */
const getUnpaidStatusTheme = (status: TodayOrder.UnpaidStatus) => {
  const themeMap: Record<TodayOrder.UnpaidStatus, 'warning' | 'danger' | 'default'> = {
    pending: 'warning',
    expired: 'danger',
    cancelled: 'default'
  };
  return themeMap[status] || 'default';
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadPaidData();
});
</script>

<template>
  <div class="today-order-page">
    <h2 class="page-title">今日订单</h2>

    <!-- Tab 切换 -->
    <Tabs v-model="activeTab" @change="handleTabChange">
      <TabPanel value="paid" label="支付订单" />
      <TabPanel value="unpaid" label="未支付订单" />
      <TabPanel value="refund" label="退单" />
    </Tabs>

    <!-- 支付订单 Tab -->
    <div v-show="activeTab === 'paid'">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">App</span>
          <Select v-model="paidFilter.appId" placeholder="全部App" clearable style="width: 160px">
            <Option value="" label="全部App" />
            <Option value="神笔马良" label="神笔马良" />
            <Option value="AppB" label="AppB" />
          </Select>
        </div>
        <div class="filter-item">
          <span class="filter-label">下单时间</span>
          <DatePicker v-model="paidFilter.dateRange" mode="date" placeholder="选择日期" clearable style="width: 160px" />
        </div>
        <div class="filter-item">
          <span class="filter-label">订单号/用户</span>
          <Input v-model="paidFilter.keyword" placeholder="请输入订单号或用户" clearable style="width: 200px" @enter="handlePaidSearch" />
        </div>
        <div class="btn-group">
          <Button theme="primary" @click="handlePaidSearch">搜索</Button>
          <Button theme="default" @click="handlePaidReset">重置</Button>
        </div>
      </div>

      <!-- 合计统计 -->
      <div class="summary-bar">
        <span class="summary-label">订单数</span>
        <span class="summary-value">{{ paidSummary.orderCount }}</span>
        <span class="summary-divider">|</span>
        <span class="summary-label">支付金额</span>
        <span class="summary-value value-positive">{{ formatAmount(paidSummary.totalAmount) }}</span>
      </div>

      <!-- 列表 -->
      <div class="table-card">
        <Table
          :data="paidList"
          :columns="paidColumns"
          :loading="loading"
          row-key="id"
          :hover="true"
          :stripe="false"
          :bordered="false"
          :pagination="{
            current: paidPage.pageNum,
            pageSize: paidPage.pageSize,
            total: paidTotal,
            pageSizeOptions: [20, 50, 100],
            showJumper: true
          }"
          :empty="paidTotal === 0 ? '暂无支付订单' : ''"
          @page-change="handlePaidPageChange"
        >
          <template #col-payAmount="{ row }">
            <span class="amount-positive">{{ formatAmount(row.payAmount) }}</span>
          </template>
          <template #row-operation="{ row }">
            <a class="action-link" @click="handlePaidDetail(row)">详情</a>
            <a class="action-link" @click="handleNote(row)">备注</a>
          </template>
        </Table>
      </div>
    </div>

    <!-- 未支付订单 Tab -->
    <div v-show="activeTab === 'unpaid'">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">App</span>
          <Select v-model="unpaidFilter.appId" placeholder="全部App" clearable style="width: 160px">
            <Option value="" label="全部App" />
            <Option value="神笔马良" label="神笔马良" />
            <Option value="AppB" label="AppB" />
          </Select>
        </div>
        <div class="filter-item">
          <span class="filter-label">未支付状态</span>
          <Select v-model="unpaidFilter.unpaidStatus" placeholder="全部状态" clearable style="width: 160px">
            <Option value="" label="全部状态" />
            <Option value="pending" label="待支付" />
            <Option value="expired" label="支付超时" />
            <Option value="cancelled" label="取消支付" />
          </Select>
        </div>
        <div class="filter-item">
          <span class="filter-label">订单号/用户</span>
          <Input v-model="unpaidFilter.keyword" placeholder="请输入订单号或用户" clearable style="width: 200px" @enter="handleUnpaidSearch" />
        </div>
        <div class="btn-group">
          <Button theme="primary" @click="handleUnpaidSearch">搜索</Button>
          <Button theme="default" @click="handleUnpaidReset">重置</Button>
        </div>
      </div>

      <!-- 合计统计 -->
      <div class="summary-bar">
        <span class="summary-label">订单数</span>
        <span class="summary-value">{{ unpaidSummary.orderCount }}</span>
        <span class="summary-divider">|</span>
        <span class="summary-label">订单金额</span>
        <span class="summary-value">{{ formatAmount(unpaidSummary.totalAmount) }}</span>
      </div>

      <!-- 列表 -->
      <div class="table-card">
        <Table
          :data="unpaidList"
          :columns="unpaidColumns"
          :loading="loading"
          row-key="id"
          :hover="true"
          :stripe="false"
          :bordered="false"
          :pagination="{
            current: unpaidPage.pageNum,
            pageSize: unpaidPage.pageSize,
            total: unpaidTotal,
            pageSizeOptions: [20, 50, 100],
            showJumper: true
          }"
          :empty="unpaidTotal === 0 ? '暂无未支付订单' : ''"
          @page-change="handleUnpaidPageChange"
        >
          <template #col-orderAmount="{ row }">
            <span>{{ formatAmount(row.orderAmount) }}</span>
          </template>
          <template #col-unpaidStatus="{ row }">
            <Tag :theme="getUnpaidStatusTheme(row.unpaidStatus)" variant="light" size="small">
              {{ row.unpaidStatusName }}
            </Tag>
          </template>
          <template #row-operation="{ row }">
            <a class="action-link" @click="handleUnpaidDetail(row)">详情</a>
            <a class="action-link" @click="handleNote(row)">备注</a>
          </template>
        </Table>
      </div>
    </div>

    <!-- 退单 Tab -->
    <div v-show="activeTab === 'refund'">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">App</span>
          <Select v-model="refundFilter.appId" placeholder="全部App" clearable style="width: 160px">
            <Option value="" label="全部App" />
            <Option value="神笔马良" label="神笔马良" />
            <Option value="AppB" label="AppB" />
          </Select>
        </div>
        <div class="filter-item">
          <span class="filter-label">退订时间</span>
          <DatePicker v-model="refundFilter.dateRange" mode="date" placeholder="选择日期" clearable style="width: 160px" />
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

      <!-- 合计统计 -->
      <div class="summary-bar">
        <span class="summary-label">退单数</span>
        <span class="summary-value">{{ refundSummary.orderCount }}</span>
        <span class="summary-divider">|</span>
        <span class="summary-label">退款金额</span>
        <span class="summary-value value-negative">{{ formatAmount(refundSummary.totalAmount) }}</span>
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
          <template #row-operation="{ row }">
            <a class="action-link" @click="handleRefundDetail(row)">详情</a>
            <a class="action-link" @click="handleNote(row)">备注</a>
          </template>
        </Table>
      </div>
    </div>

    <!-- 支付订单详情弹窗 -->
    <Dialog v-model:visible="paidDetailVisible" header="订单详情 - 已支付" width="560px" attach="body" :footer="false">
      <div v-if="paidDetailData" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">订单号</span>
          <span class="detail-value">{{ paidDetailData.orderNo }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户ID</span>
          <span class="detail-value">{{ paidDetailData.userId }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户名</span>
          <span class="detail-value">{{ paidDetailData.userName }}（{{ paidDetailData.phone }}）</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">所属 App</span>
          <span class="detail-value">{{ paidDetailData.appName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SKU</span>
          <span class="detail-value">{{ paidDetailData.skuName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付方式</span>
          <span class="detail-value">{{ paidDetailData.payMethod }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付时间</span>
          <span class="detail-value">{{ paidDetailData.payTime }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">订单金额</span>
          <span class="detail-value">{{ formatAmount(paidDetailData.orderAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">支付金额</span>
          <span class="detail-value value-positive">{{ formatAmount(paidDetailData.payAmount) }}</span>
        </div>
      </div>
      <div class="detail-footer">
        <Button theme="primary" @click="paidDetailVisible = false">关闭</Button>
      </div>
    </Dialog>

    <!-- 未支付订单详情弹窗 -->
    <Dialog v-model:visible="unpaidDetailVisible" header="订单详情 - 未支付" width="560px" attach="body" :footer="false">
      <div v-if="unpaidDetailData" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">订单号</span>
          <span class="detail-value">{{ unpaidDetailData.orderNo }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户ID</span>
          <span class="detail-value">{{ unpaidDetailData.userId }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户名</span>
          <span class="detail-value">{{ unpaidDetailData.userName }}（{{ unpaidDetailData.phone }}）</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">所属 App</span>
          <span class="detail-value">{{ unpaidDetailData.appName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SKU</span>
          <span class="detail-value">{{ unpaidDetailData.skuName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">订单金额</span>
          <span class="detail-value">{{ formatAmount(unpaidDetailData.orderAmount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">下单时间</span>
          <span class="detail-value">{{ unpaidDetailData.orderTime }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">超时时间</span>
          <span class="detail-value">{{ unpaidDetailData.expireTime || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">未支付状态</span>
          <span class="detail-value">
            <Tag :theme="getUnpaidStatusTheme(unpaidDetailData.unpaidStatus)" variant="light" size="small">
              {{ unpaidDetailData.unpaidStatusName }}
            </Tag>
          </span>
        </div>
      </div>
      <div class="detail-footer">
        <Button theme="primary" @click="unpaidDetailVisible = false">关闭</Button>
      </div>
    </Dialog>

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
          <span class="detail-label">用户名</span>
          <span class="detail-value">{{ refundDetailData.userName }}（{{ refundDetailData.phone }}）</span>
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

    <!-- 订单备注弹窗 -->
    <Dialog v-model:visible="noteVisible" :header="'订单备注 - ' + noteOrderNo" width="520px" attach="body" :footer="false">
      <div class="note-content">
        <div class="note-list">
          <div v-if="noteList.length === 0" class="note-empty">暂无备注</div>
          <div v-for="note in noteList" v-else :key="note.id" class="note-item">
            <div class="note-meta">{{ note.creator }} · {{ note.createdAt }}</div>
            <div class="note-text">{{ note.content }}</div>
          </div>
        </div>
        <div class="note-input-area">
          <Textarea
            v-model="noteInput"
            placeholder="请输入备注内容（500字以内）"
            :maxlength="500"
            :autosize="{ minRows: 2, maxRows: 4 }"
            @change="handleNoteInput"
          />
          <div class="note-char-count">{{ noteCharCount }}/500</div>
        </div>
      </div>
      <div class="detail-footer">
        <Button theme="default" @click="noteVisible = false">取消</Button>
        <Button theme="primary" @click="handleAddNote">保存</Button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.today-order-page {
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
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    margin-bottom: 16px;
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    .summary-label {
      font-size: 14px;
      color: var(--td-text-color-secondary);
    }

    .summary-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }

    .value-positive {
      color: var(--td-success-color);
    }

    .value-negative {
      color: var(--td-error-color);
    }

    .summary-divider {
      color: var(--td-component-stroke);
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
  }

  .detail-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-stroke);
    margin-top: 16px;
    gap: 8px;
  }

  .note-content {
    .note-list {
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 16px;

      .note-empty {
        padding: 40px;
        text-align: center;
        color: var(--td-text-color-secondary);
        font-size: 14px;
      }

      .note-item {
        padding: 12px 0;
        border-bottom: 1px solid var(--td-component-stroke);

        &:last-child {
          border-bottom: none;
        }

        .note-meta {
          font-size: 12px;
          color: var(--td-text-color-secondary);
          margin-bottom: 4px;
        }

        .note-text {
          font-size: 14px;
          color: var(--td-text-color-primary);
          line-height: 1.5;
        }
      }
    }

    .note-input-area {
      .note-char-count {
        font-size: 12px;
        color: var(--td-text-color-secondary);
        text-align: right;
        margin-top: 4px;
      }
    }
  }
}
</style>
