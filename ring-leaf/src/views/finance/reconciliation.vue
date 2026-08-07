<template>
  <div class="reconciliation-page">
    <h1 class="page-title">对账管理</h1>

    <!-- 摘要卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-label">今日对账笔数</div>
        <div class="summary-value">{{ summary.todayReconciliationCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">对账一致金额</div>
        <div class="summary-value matched-value">&yen;{{ formatAmount(summary.matchedAmount) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">差异笔数</div>
        <div class="summary-value diff-value">{{ summary.mismatchCount }}</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">对账日期</span>
        <t-date-picker v-model="filterDate" placeholder="选择日期" style="width: 160px" />
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
        <span class="filter-label">对账状态</span>
        <t-select v-model="filterStatus" placeholder="全部" clearable style="width: 160px">
          <t-option value="" label="全部" />
          <t-option value="matched" label="一致" />
          <t-option value="mismatched" label="有差异" />
        </t-select>
      </div>
      <div class="filter-actions">
        <t-button theme="primary" variant="base" size="small" @click="handleSearch">搜索</t-button>
        <t-button theme="default" variant="base" size="small" @click="handleReset">重置</t-button>
        <t-button theme="primary" variant="outline" size="small" @click="uploadVisible = true">执行对账</t-button>
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
        <template #col-systemAmount="{ row }"> &yen;{{ formatAmount(row.systemAmount) }} </template>
        <template #col-channelAmount="{ row }"> &yen;{{ formatAmount(row.channelAmount) }} </template>
        <template #col-diffAmount="{ row }">
          <span :class="row.diffAmount !== 0 ? 'diff-text' : ''">
            {{ row.diffAmount < 0 ? '-' : '' }}&yen;{{ formatAmount(Math.abs(row.diffAmount)) }}
          </span>
        </template>
        <template #col-status="{ row }">
          <span :class="row.status === 'matched' ? 'status-ok' : 'status-diff'">
            {{ row.status === 'matched' ? '一致' : '有差异' }}
          </span>
        </template>
        <template #col-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">
            {{ row.status === 'matched' ? '查看明细' : '查看差异' }}
          </a>
          <a v-if="row.status === 'mismatched'" class="action-link" @click="handleSettle">平账</a>
        </template>
      </t-table>
    </div>

    <!-- 上传对账文件弹窗 -->
    <t-dialog v-model:visible="uploadVisible" header="上传对账文件" width="480px" attach="body" :footer="false">
      <div class="upload-form">
        <div class="form-row">
          <span class="form-label">支付方式</span>
          <t-radio-group v-model="uploadForm.channel">
            <t-radio value="wechat">微信支付</t-radio>
            <t-radio value="alipay">支付宝</t-radio>
          </t-radio-group>
        </div>
        <div class="form-row">
          <span class="form-label">对账日期</span>
          <t-date-picker v-model="uploadForm.date" placeholder="选择对账日期" style="width: 100%" />
        </div>
        <div class="form-row">
          <span class="form-label">对账文件</span>
          <t-upload v-model="uploadForm.files" theme="file" accept=".csv,.xlsx" :max="1" :auto-upload="false" @fail="handleUploadFail" />
        </div>
        <div class="form-footer">
          <t-button theme="default" variant="base" @click="uploadVisible = false">取消</t-button>
          <t-button theme="primary" variant="base" @click="handleUpload">上传并比对</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- 对账详情弹窗 -->
    <t-dialog v-model:visible="detailVisible" :header="detailTitle" width="480px" attach="body" :footer="false">
      <template v-if="detailData">
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">对账日期</span>
            <span class="detail-value">{{ detailData.reconciliationDate }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">支付方式</span>
            <span class="detail-value">{{ detailData.channelName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">平台笔数</span>
            <span class="detail-value">{{ detailData.channelOrderCount }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">平台金额</span>
            <span class="detail-value">&yen;{{ formatAmount(detailData.channelAmount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">系统笔数</span>
            <span class="detail-value">{{ detailData.systemOrderCount }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">系统金额</span>
            <span class="detail-value">&yen;{{ formatAmount(detailData.systemAmount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">对账状态</span>
            <span class="detail-value" :class="detailData.status === 'matched' ? 'status-ok' : 'status-diff'">
              {{ detailData.status === 'matched' ? '一致' : '有差异' }}
            </span>
          </div>
        </div>
        <div class="detail-footer">
          <t-button theme="default" variant="base" @click="detailVisible = false">关闭</t-button>
        </div>
      </template>
    </t-dialog>

    <!-- 差异明细弹窗 -->
    <t-dialog v-model:visible="diffVisible" :header="diffTitle" width="720px" attach="body" :footer="false">
      <t-table
        :data="diffTableData"
        :columns="diffColumns"
        row-key="id"
        :hover="true"
        :loading="diffLoading"
        :pagination="{ current: diffPageNum, pageSize: diffPageSize, total: diffTotal }"
        @page-change="handleDiffPageChange"
      >
        <template #col-platformAmount="{ row }"> &yen;{{ formatAmount(row.platformAmount) }} </template>
        <template #col-systemAmount="{ row }"> &yen;{{ formatAmount(row.systemAmount) }} </template>
      </t-table>
    </t-dialog>
  </div>
</template>

<script setup lang="ts" name="ReconciliationManager">
import { ref, computed, onMounted } from 'vue';
import type { PrimaryTableCol, PageInfo, UploadFile } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import type { Reconciliation } from '@/api/modules/reconciliation';
import {
  getReconciliationListApi,
  getReconciliationSummaryApi,
  getReconciliationDetailApi,
  getReconciliationDiffApi,
  uploadReconciliationFileApi
} from '@/api/modules/reconciliation';

/* ===== 摘要数据 ===== */
const summary = ref({
  todayReconciliationCount: 0,
  matchedAmount: 0,
  mismatchCount: 0
});

const loadSummary = async () => {
  try {
    const { data } = await getReconciliationSummaryApi();
    summary.value = data;
  } catch {
    summary.value = { todayReconciliationCount: 0, matchedAmount: 0, mismatchCount: 0 };
  }
};

/* ===== 筛选条件 ===== */
const filterDate = ref<string>('');
const filterChannel = ref<Reconciliation.Channel | ''>('');
const filterStatus = ref<Reconciliation.Status | ''>('');

const handleSearch = () => {
  pageNum.value = 1;
  loadTableData();
};

const handleReset = () => {
  filterDate.value = '';
  filterChannel.value = '';
  filterStatus.value = '';
  pageNum.value = 1;
  loadTableData();
};

/* ===== 列表数据 ===== */
const loading = ref(false);
const tableData = ref<Reconciliation.ReconciliationItem[]>([]);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

const loadTableData = async () => {
  loading.value = true;
  try {
    const params: Reconciliation.ListParams = {
      reconciliationDate: filterDate.value || undefined,
      channel: filterChannel.value || undefined,
      status: filterStatus.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    };
    const { data } = await getReconciliationListApi(params);
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
const columns: PrimaryTableCol<Reconciliation.ReconciliationItem>[] = [
  { colKey: 'reconciliationDate', title: '对账日期', width: 120 },
  { colKey: 'channelName', title: '支付渠道', width: 100 },
  { colKey: 'systemOrderCount', title: '系统订单数', width: 120 },
  { colKey: 'systemAmount', title: '系统金额', width: 120 },
  { colKey: 'channelOrderCount', title: '渠道账单数', width: 120 },
  { colKey: 'channelAmount', title: '渠道金额', width: 120 },
  { colKey: 'diffAmount', title: '差异金额', width: 120 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'operation', title: '操作', width: 160, fixed: 'right' }
];

/* ===== 上传对账文件 ===== */
const uploadVisible = ref(false);
const uploadForm = ref({
  channel: 'wechat' as Reconciliation.Channel,
  date: '',
  files: [] as UploadFile[]
});

const handleUpload = async () => {
  if (!uploadForm.value.date) {
    MessagePlugin.warning('请选择对账日期');
    return;
  }
  if (!uploadForm.value.files || uploadForm.value.files.length === 0) {
    MessagePlugin.warning('请上传对账文件');
    return;
  }
  const file = uploadForm.value.files[0]?.raw as File;
  if (!file) {
    MessagePlugin.warning('请选择有效的文件');
    return;
  }
  try {
    await uploadReconciliationFileApi({
      channel: uploadForm.value.channel,
      reconciliationDate: uploadForm.value.date,
      file
    });
    MessagePlugin.success('对账完成');
    uploadVisible.value = false;
    uploadForm.value = { channel: 'wechat', date: '', files: [] };
    loadSummary();
    loadTableData();
  } catch {
    MessagePlugin.error('对账失败，请重试');
  }
};

const handleUploadFail = () => {
  MessagePlugin.error('文件上传失败，仅支持 .csv/.xlsx 格式');
};

/* ===== 对账详情 ===== */
const detailVisible = ref(false);
const detailData = ref<Reconciliation.ReconciliationDetail | null>(null);

const detailTitle = computed(() => {
  if (!detailData.value) return '对账详情';
  return `对账详情 - ${detailData.value.reconciliationDate} ${detailData.value.channelName}`;
});

const handleDetail = async (row: Reconciliation.ReconciliationItem) => {
  if (row.status === 'mismatched') {
    openDiffDialog(row.id);
    return;
  }
  try {
    const { data } = await getReconciliationDetailApi(row.id);
    detailData.value = data;
    detailVisible.value = true;
  } catch {
    MessagePlugin.error('获取对账详情失败');
  }
};

/* ===== 差异明细 ===== */
const diffVisible = ref(false);
const diffTableData = ref<Reconciliation.DiffItem[]>([]);
const diffLoading = ref(false);
const diffPageNum = ref(1);
const diffPageSize = ref(10);
const diffTotal = ref(0);
const currentDiffId = ref(0);

const diffTitle = computed(() => {
  return `差异明细`;
});

const diffColumns: PrimaryTableCol<Reconciliation.DiffItem>[] = [
  { colKey: 'orderNo', title: '订单号', width: 200 },
  { colKey: 'platformAmount', title: '平台金额', width: 120 },
  { colKey: 'systemAmount', title: '系统金额', width: 120 },
  { colKey: 'diffReasonName', title: '差异原因', width: 160 }
];

const openDiffDialog = async (id: number) => {
  currentDiffId.value = id;
  diffPageNum.value = 1;
  await loadDiffData();
  diffVisible.value = true;
};

const loadDiffData = async () => {
  diffLoading.value = true;
  try {
    const { data } = await getReconciliationDiffApi(currentDiffId.value, {
      pageNum: diffPageNum.value,
      pageSize: diffPageSize.value
    });
    diffTableData.value = data.list;
    diffTotal.value = data.total;
  } catch {
    diffTableData.value = [];
    diffTotal.value = 0;
  } finally {
    diffLoading.value = false;
  }
};

const handleDiffPageChange = (pageInfo: PageInfo) => {
  diffPageNum.value = pageInfo.current ?? 1;
  diffPageSize.value = pageInfo.pageSize ?? 10;
  loadDiffData();
};

/* ===== 平账 ===== */
const handleSettle = async () => {
  MessagePlugin.info('平账功能开发中');
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
.reconciliation-page {
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

        &.matched-value {
          color: #00b42a;
        }

        &.diff-value {
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

.status-ok {
  color: #00b42a;
}

.status-diff {
  color: #f53f3f;
}

.diff-text {
  color: #f53f3f;
}

.action-link {
  color: #0052d9;
  cursor: pointer;
  text-decoration: none;
  margin-right: 12px;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
}

.upload-form {
  .form-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    gap: 16px;

    .form-label {
      width: 80px;
      color: #484a5c;
      font-size: 14px;
      flex-shrink: 0;
      text-align: right;
    }
  }

  .form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
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
