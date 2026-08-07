<template>
  <div class="settlement-flow-page">
    <h1 class="page-title">确收流水</h1>

    <!-- 摘要卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-label">今日确收笔数</div>
        <div class="summary-value">{{ summary.todayConfirmCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">今日确收金额</div>
        <div class="summary-value amount-value">&yen;{{ formatAmount(summary.todayConfirmAmount) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">累计确收金额</div>
        <div class="summary-value cumulative-value">&yen;{{ formatAmount(summary.cumulativeConfirmAmount) }}</div>
      </div>
    </div>

    <!-- Tab 切换 -->
    <t-tabs v-model="activeTab">
      <!-- 确收策略 Tab -->
      <t-tab-panel value="strategy" label="确收策略">
        <div class="tab-content">
          <div class="filter-bar">
            <div class="filter-item">
              <span class="filter-label">App 筛选</span>
              <t-select v-model="strategyFilterApp" placeholder="全部" clearable style="width: 160px">
                <t-option value="" label="全部" />
                <t-option value="shenbi" label="神笔马良" />
                <t-option value="app-b" label="App B" />
              </t-select>
            </div>
            <div class="filter-actions">
              <t-button theme="primary" variant="base" size="small" @click="handleStrategySearch">搜索</t-button>
              <t-button theme="default" variant="base" size="small" @click="handleStrategyReset">重置</t-button>
              <t-button theme="primary" size="small" @click="openStrategyDialog()">新建策略</t-button>
            </div>
          </div>

          <div class="table-card">
            <t-table
              :data="strategyTableData"
              :columns="strategyColumns"
              row-key="id"
              :hover="true"
              :stripe="false"
              :bordered="false"
              :loading="strategyLoading"
              :pagination="{ current: strategyPageNum, pageSize: strategyPageSize, total: strategyTotal, showJumper: true, showPageSize: true }"
              :page-size-options="[20, 50, 100]"
              @page-change="handleStrategyPageChange"
            >
              <template #col-status="{ row }">
                <span :class="row.status === 'active' ? 'status-active' : 'status-inactive'">
                  {{ row.statusName }}
                </span>
              </template>
              <template #col-skus="{ row }">
                {{ row.skus.join('、') }}
              </template>
              <template #col-operation="{ row }">
                <a class="action-link" @click="openStrategyDialog(row)">编辑</a>
                <a class="action-link" @click="handleToggleStrategy(row)">{{ row.status === 'active' ? '失效' : '生效' }}</a>
              </template>
            </t-table>
          </div>
        </div>
      </t-tab-panel>

      <!-- 确收流水 Tab -->
      <t-tab-panel value="flow" label="确收流水">
        <div class="tab-content">
          <div class="filter-bar">
            <div class="filter-item">
              <span class="filter-label">App 筛选</span>
              <t-select v-model="flowFilterApp" placeholder="全部" clearable style="width: 160px">
                <t-option value="" label="全部" />
                <t-option value="shenbi" label="神笔马良" />
                <t-option value="app-b" label="App B" />
              </t-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">SKU 筛选</span>
              <t-select v-model="flowFilterSku" placeholder="全部" clearable style="width: 160px">
                <t-option value="" label="全部" />
                <t-option value="月卡" label="月卡" />
                <t-option value="季卡" label="季卡" />
                <t-option value="年卡" label="年卡" />
              </t-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">确收时间</span>
              <t-date-range-picker v-model="flowFilterDate" style="width: 240px" />
            </div>
            <div class="filter-item">
              <span class="filter-label">关联订单号</span>
              <t-input v-model="flowFilterOrderNo" placeholder="请输入订单号" clearable style="width: 180px" />
            </div>
            <div class="filter-actions">
              <t-button theme="primary" variant="base" size="small" @click="handleFlowSearch">搜索</t-button>
              <t-button theme="default" variant="base" size="small" @click="handleFlowReset">重置</t-button>
            </div>
          </div>

          <div class="table-card">
            <t-table
              :data="flowTableData"
              :columns="flowColumns"
              row-key="id"
              :hover="true"
              :stripe="false"
              :bordered="false"
              :loading="flowLoading"
              :pagination="{ current: flowPageNum, pageSize: flowPageSize, total: flowTotal, showJumper: true, showPageSize: true }"
              :page-size-options="[20, 50, 100]"
              @page-change="handleFlowPageChange"
            >
              <template #col-confirmAmount="{ row }">
                <span class="amount-text">&yen;{{ formatAmount(row.confirmAmount) }}</span>
              </template>
              <template #col-cumulativeAmount="{ row }">
                <span class="cumulative-text">&yen;{{ formatAmount(row.cumulativeAmount) }}</span>
              </template>
              <template #col-operation="{ row }">
                <a class="action-link" @click="handleFlowDetail(row)">详情</a>
              </template>
            </t-table>
          </div>
        </div>
      </t-tab-panel>

      <!-- 确收任务执行记录 Tab -->
      <t-tab-panel value="task" label="确收任务执行记录">
        <div class="tab-content">
          <div class="table-card">
            <t-table
              :data="taskTableData"
              :columns="taskColumns"
              row-key="id"
              :hover="true"
              :stripe="false"
              :bordered="false"
              :loading="taskLoading"
              :pagination="{ current: taskPageNum, pageSize: taskPageSize, total: taskTotal, showJumper: true, showPageSize: true }"
              :page-size-options="[20, 50, 100]"
              @page-change="handleTaskPageChange"
            >
              <template #col-result="{ row }">
                <span :class="row.result === 'success' ? 'status-active' : 'status-failed'">
                  {{ row.resultName }}
                </span>
              </template>
              <template #col-confirmAmount="{ row }">
                <span class="amount-text">&yen;{{ formatAmount(row.confirmAmount) }}</span>
              </template>
            </t-table>
          </div>
        </div>
      </t-tab-panel>
    </t-tabs>

    <!-- 新建/编辑确收策略弹窗 -->
    <t-dialog
      v-model:visible="strategyDialogVisible"
      :header="strategyForm.id ? '编辑确收策略' : '新建确收策略'"
      width="520px"
      attach="body"
      :footer="false"
    >
      <t-form ref="strategyFormRef" :data="strategyForm" :rules="strategyRules" :label-width="80" class="strategy-form">
        <t-form-item label="策略名称" name="name">
          <t-input v-model="strategyForm.name" placeholder="请输入策略名称（1-50字符）" maxlength="50" />
        </t-form-item>
        <t-form-item label="所属 App" name="appId">
          <t-select v-model="strategyForm.appId" placeholder="请选择所属 App">
            <t-option value="shenbi" label="神笔马良" />
            <t-option value="app-b" label="App B" />
          </t-select>
        </t-form-item>
        <t-form-item label="关联 SKU" name="skus">
          <t-select v-model="strategyForm.skus" multiple placeholder="请选择关联 SKU">
            <t-option value="月卡" label="月卡" />
            <t-option value="季卡" label="季卡" />
            <t-option value="年卡" label="年卡" />
          </t-select>
        </t-form-item>
        <t-form-item label="确收方式" name="confirmMethod">
          <t-radio-group v-model="strategyForm.confirmMethod">
            <t-radio value="daily">按日分摊</t-radio>
            <t-radio value="once">一次性确收</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="生效时间" name="effectiveDate">
          <t-date-picker v-model="strategyForm.effectiveDate" placeholder="选择生效日期" style="width: 100%" />
        </t-form-item>
        <div class="form-footer">
          <t-button theme="default" variant="base" @click="strategyDialogVisible = false">取消</t-button>
          <t-button theme="primary" variant="base" @click="handleSaveStrategy">保存</t-button>
        </div>
      </t-form>
    </t-dialog>

    <!-- 确收流水详情弹窗 -->
    <t-dialog v-model:visible="flowDetailVisible" header="确收流水详情" width="480px" attach="body" :footer="false">
      <template v-if="flowDetailData">
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">确收日期</span>
            <span class="detail-value">{{ flowDetailData.confirmDate }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">订单号</span>
            <span class="detail-value">{{ flowDetailData.orderNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">用户</span>
            <span class="detail-value">{{ flowDetailData.userName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">所属 App</span>
            <span class="detail-value">{{ flowDetailData.appName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">SKU</span>
            <span class="detail-value">{{ flowDetailData.sku }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">确收方式</span>
            <span class="detail-value">{{ flowDetailData.confirmMethodName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">本次确收</span>
            <span class="detail-value amount-text">&yen;{{ formatAmount(flowDetailData.confirmAmount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">累计确收</span>
            <span class="detail-value cumulative-text">&yen;{{ formatAmount(flowDetailData.cumulativeAmount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">支付金额</span>
            <span class="detail-value">&yen;{{ formatAmount(flowDetailData.payAmount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">确收策略</span>
            <span class="detail-value">{{ flowDetailData.strategyName }}</span>
          </div>
        </div>
        <div class="detail-footer">
          <t-button theme="default" variant="base" @click="flowDetailVisible = false">关闭</t-button>
        </div>
      </template>
    </t-dialog>
  </div>
</template>

<script setup lang="ts" name="SettlementFlow">
import { ref, onMounted } from 'vue';
import type { PrimaryTableCol, PageInfo, FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import type { SettlementFlow as SF } from '@/api/modules/settlement-flow';
import {
  getStrategyListApi,
  createStrategyApi,
  updateStrategyApi,
  toggleStrategyApi,
  getSettlementFlowListApi,
  getSettlementFlowSummaryApi,
  getSettlementFlowDetailApi,
  getTaskListApi
} from '@/api/modules/settlement-flow';

/* ===== 摘要数据 ===== */
const summary = ref({
  todayConfirmCount: 0,
  todayConfirmAmount: 0,
  cumulativeConfirmAmount: 0
});

const loadSummary = async () => {
  try {
    const { data } = await getSettlementFlowSummaryApi();
    summary.value = data;
  } catch {
    summary.value = { todayConfirmCount: 0, todayConfirmAmount: 0, cumulativeConfirmAmount: 0 };
  }
};

/* ===== Tab 切换 ===== */
const activeTab = ref('flow');

/* ===== 确收策略 Tab ===== */
const strategyFilterApp = ref('');
const strategyTableData = ref<SF.StrategyItem[]>([]);
const strategyLoading = ref(false);
const strategyPageNum = ref(1);
const strategyPageSize = ref(20);
const strategyTotal = ref(0);

const loadStrategyData = async () => {
  strategyLoading.value = true;
  try {
    const { data } = await getStrategyListApi({
      appId: strategyFilterApp.value || undefined,
      pageNum: strategyPageNum.value,
      pageSize: strategyPageSize.value
    });
    strategyTableData.value = data.list;
    strategyTotal.value = data.total;
  } catch {
    strategyTableData.value = [];
    strategyTotal.value = 0;
  } finally {
    strategyLoading.value = false;
  }
};

const handleStrategySearch = () => {
  strategyPageNum.value = 1;
  loadStrategyData();
};

const handleStrategyReset = () => {
  strategyFilterApp.value = '';
  strategyPageNum.value = 1;
  loadStrategyData();
};

const handleStrategyPageChange = (pageInfo: PageInfo) => {
  strategyPageNum.value = pageInfo.current ?? 1;
  strategyPageSize.value = pageInfo.pageSize ?? 20;
  loadStrategyData();
};

const strategyColumns: PrimaryTableCol<SF.StrategyItem>[] = [
  { colKey: 'name', title: '策略名称', width: 140 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'skus', title: '关联SKU', width: 160 },
  { colKey: 'confirmMethodName', title: '确收方式', width: 120 },
  { colKey: 'effectiveDate', title: '生效时间', width: 120 },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right' }
];

/* ===== 策略弹窗 ===== */
const strategyDialogVisible = ref(false);
const strategyFormRef = ref<FormInstanceFunctions>();
const strategyForm = ref<SF.StrategyForm>({
  name: '',
  appId: '',
  skus: [],
  confirmMethod: 'daily',
  effectiveDate: ''
});

const strategyRules: Record<string, FormRule[]> = {
  name: [
    { required: true, message: '请输入策略名称', type: 'error' },
    { min: 1, max: 50, message: '策略名称长度为1-50字符', type: 'error' }
  ],
  appId: [{ required: true, message: '请选择所属 App', type: 'error' }],
  skus: [{ required: true, type: 'error', message: '请至少选择1个SKU' }],
  effectiveDate: [{ required: true, message: '请选择生效时间', type: 'error' }]
};

const openStrategyDialog = (row?: SF.StrategyItem) => {
  if (row) {
    strategyForm.value = {
      id: row.id,
      name: row.name,
      appId: row.appId,
      skus: [...row.skus],
      confirmMethod: row.confirmMethod,
      effectiveDate: row.effectiveDate
    };
  } else {
    strategyForm.value = { id: undefined, name: '', appId: '', skus: [], confirmMethod: 'daily', effectiveDate: '' };
  }
  strategyDialogVisible.value = true;
};

const handleSaveStrategy = async () => {
  const valid = await strategyFormRef.value?.validate();
  if (valid) return;

  try {
    const { id, ...formData } = strategyForm.value;
    if (id) {
      await updateStrategyApi(id, formData);
      MessagePlugin.success('确收策略已更新');
    } else {
      await createStrategyApi(formData);
      MessagePlugin.success('确收策略已创建');
    }
    strategyDialogVisible.value = false;
    loadStrategyData();
  } catch {
    MessagePlugin.error('保存失败，请重试');
  }
};

const handleToggleStrategy = async (row: SF.StrategyItem) => {
  try {
    await toggleStrategyApi(row.id);
    MessagePlugin.success(`策略已${row.status === 'active' ? '失效' : '生效'}`);
    loadStrategyData();
  } catch {
    MessagePlugin.error('操作失败，请重试');
  }
};

/* ===== 确收流水 Tab ===== */
const flowFilterApp = ref('');
const flowFilterSku = ref('');
const flowFilterDate = ref<string[]>([]);
const flowFilterOrderNo = ref('');
const flowTableData = ref<SF.FlowItem[]>([]);
const flowLoading = ref(false);
const flowPageNum = ref(1);
const flowPageSize = ref(20);
const flowTotal = ref(0);

const loadFlowData = async () => {
  flowLoading.value = true;
  try {
    const params: SF.ListParams = {
      appId: flowFilterApp.value || undefined,
      sku: flowFilterSku.value || undefined,
      confirmDate: flowFilterDate.value?.join(',') || undefined,
      orderNo: flowFilterOrderNo.value || undefined,
      pageNum: flowPageNum.value,
      pageSize: flowPageSize.value
    };
    const { data } = await getSettlementFlowListApi(params);
    flowTableData.value = data.list;
    flowTotal.value = data.total;
  } catch {
    flowTableData.value = [];
    flowTotal.value = 0;
  } finally {
    flowLoading.value = false;
  }
};

const handleFlowSearch = () => {
  flowPageNum.value = 1;
  loadFlowData();
};

const handleFlowReset = () => {
  flowFilterApp.value = '';
  flowFilterSku.value = '';
  flowFilterDate.value = [];
  flowFilterOrderNo.value = '';
  flowPageNum.value = 1;
  loadFlowData();
};

const handleFlowPageChange = (pageInfo: PageInfo) => {
  flowPageNum.value = pageInfo.current ?? 1;
  flowPageSize.value = pageInfo.pageSize ?? 20;
  loadFlowData();
};

const flowColumns: PrimaryTableCol<SF.FlowItem>[] = [
  { colKey: 'confirmDate', title: '确收日期', width: 120 },
  { colKey: 'orderNo', title: '订单号', width: 180 },
  { colKey: 'appName', title: 'App名称', width: 120 },
  { colKey: 'sku', title: 'SKU', width: 100 },
  { colKey: 'confirmAmount', title: '确收金额', width: 120 },
  { colKey: 'cumulativeAmount', title: '累计确收', width: 120 },
  { colKey: 'operation', title: '操作', width: 80, fixed: 'right' }
];

/* ===== 流水详情 ===== */
const flowDetailVisible = ref(false);
const flowDetailData = ref<SF.FlowDetail | null>(null);

const handleFlowDetail = async (row: SF.FlowItem) => {
  try {
    const { data } = await getSettlementFlowDetailApi(row.id);
    flowDetailData.value = data;
    flowDetailVisible.value = true;
  } catch {
    MessagePlugin.error('获取确收流水详情失败');
  }
};

/* ===== 确收任务执行记录 Tab ===== */
const taskTableData = ref<SF.TaskItem[]>([]);
const taskLoading = ref(false);
const taskPageNum = ref(1);
const taskPageSize = ref(20);
const taskTotal = ref(0);

const loadTaskData = async () => {
  taskLoading.value = true;
  try {
    const { data } = await getTaskListApi({
      pageNum: taskPageNum.value,
      pageSize: taskPageSize.value
    });
    taskTableData.value = data.list;
    taskTotal.value = data.total;
  } catch {
    taskTableData.value = [];
    taskTotal.value = 0;
  } finally {
    taskLoading.value = false;
  }
};

const handleTaskPageChange = (pageInfo: PageInfo) => {
  taskPageNum.value = pageInfo.current ?? 1;
  taskPageSize.value = pageInfo.pageSize ?? 20;
  loadTaskData();
};

const taskColumns: PrimaryTableCol<SF.TaskItem>[] = [
  { colKey: 'executeTime', title: '执行时间', width: 180 },
  { colKey: 'result', title: '执行结果', width: 100 },
  { colKey: 'processCount', title: '处理笔数', width: 100 },
  { colKey: 'confirmAmount', title: '确收金额', width: 120 },
  { colKey: 'errorReason', title: '异常原因', width: 200 }
];

/* ===== 工具方法 ===== */
const formatAmount = (val: number) => {
  return val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadSummary();
  loadFlowData();
});
</script>

<style scoped lang="scss">
.settlement-flow-page {
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

        &.amount-value {
          color: #00b42a;
        }

        &.cumulative-value {
          color: #0052d9;
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

.status-active {
  color: #00b42a;
}

.status-inactive {
  color: #8f929e;
}

.status-failed {
  color: #f53f3f;
}

.amount-text {
  color: #00b42a;
}

.cumulative-text {
  color: #0052d9;
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

.strategy-form {
  .form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
