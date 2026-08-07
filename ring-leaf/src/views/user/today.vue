<script setup lang="ts" name="TodayUser">
import { ref, computed, onMounted } from 'vue';
import { Card, Row, Col, Select, Option, Tabs, TabPanel, Table, Dialog, Button, Tag, Tooltip, Loading } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import type { EChartsOption } from 'echarts';
import VChart from 'vue-echarts';

use([CanvasRenderer, LineChart, TooltipComponent, LegendComponent, GridComponent]);

import {
  getTodayMetricsApi,
  getTodayRegisteredListApi,
  getTodayActiveListApi,
  getTodayPayListApi,
  getTodayUserDetailApi,
  getChannelOptionsApi,
  getTrendDataApi
} from '@/api/user.ts';
import type { TodayUser } from '@/api/modules/user.ts';

/* ===== 页面状态 ===== */
const todayDate = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

const activeTab = ref('register');
const selectedChannel = ref('all');
const channelOptionsList = ref<TodayUser.ChannelOption[]>([]);
const metrics = ref<TodayUser.TodayMetrics>({
  registerCount: 0,
  activeCount: 0,
  payCount: 0,
  registerCompare: 0,
  activeCompare: 0,
  payCompare: 0,
  registerYesterday: 0,
  activeYesterday: 0,
  payYesterday: 0
});

/* ===== 列表数据 ===== */
const registerList = ref<TodayUser.UserItem[]>([]);
const activeList = ref<TodayUser.UserItem[]>([]);
const payList = ref<TodayUser.UserItem[]>([]);

const registerTotal = ref(0);
const activeTotal = ref(0);
const payTotal = ref(0);

const registerLoading = ref(false);
const activeLoading = ref(false);
const payLoading = ref(false);

/* ===== 分页 ===== */
const registerPage = ref({ pageNum: 1, pageSize: 20 });
const activePage = ref({ pageNum: 1, pageSize: 20 });
const payPage = ref({ pageNum: 1, pageSize: 20 });

/* ===== 用户详情弹窗 ===== */
const detailVisible = ref(false);
const userDetail = ref<TodayUser.UserDetail | null>(null);

/* ===== 趋势图弹窗 ===== */
const trendVisible = ref(false);
const trendTitle = ref('');
const trendLoading = ref(false);
const trendDataRef = ref<TodayUser.TrendData>({ today: [], yesterday: [], lastWeek: [] });

/* ===== 二级渠道截断辅助 ===== */
const truncateChannel = (text: string, maxLen = 10) => {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

/* ===== 表格列定义 ===== */
const registerColumns: PrimaryTableCol[] = [
  { colKey: 'userId', title: '用户 ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 140 },
  { colKey: 'nickname', title: '昵称', width: 120 },
  { colKey: 'channel1', title: '一级渠道', width: 100 },
  { colKey: 'registerTime', title: '注册时间', width: 180 },
  { colKey: 'channel2', title: '二级渠道', width: 200 },
  { colKey: 'op', title: '操作', width: 80, fixed: 'right' }
];

const activeColumns: PrimaryTableCol[] = [
  { colKey: 'userId', title: '用户 ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 140 },
  { colKey: 'nickname', title: '昵称', width: 120 },
  { colKey: 'channel1', title: '一级渠道', width: 100 },
  { colKey: 'activeTime', title: '今日首次活跃时间', width: 180 },
  { colKey: 'channel2', title: '二级渠道', width: 200 },
  { colKey: 'op', title: '操作', width: 80, fixed: 'right' }
];

const payColumns: PrimaryTableCol[] = [
  { colKey: 'userId', title: '用户 ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 140 },
  { colKey: 'nickname', title: '昵称', width: 120 },
  { colKey: 'channel1', title: '一级渠道', width: 100 },
  { colKey: 'payTime', title: '今日首次支付时间', width: 180 },
  { colKey: 'channel2', title: '二级渠道', width: 200 },
  { colKey: 'op', title: '操作', width: 80, fixed: 'right' }
];

/* ===== 数据加载 ===== */
const loadMetrics = async () => {
  const { data } = await getTodayMetricsApi();
  if (data) {
    metrics.value = data;
  }
};

const loadChannelOptions = async () => {
  const { data } = await getChannelOptionsApi();
  if (data) {
    channelOptionsList.value = data;
  }
};

const loadRegisterList = async () => {
  registerLoading.value = true;
  try {
    const { data } = await getTodayRegisteredListApi({
      channelId: selectedChannel.value === 'all' ? undefined : selectedChannel.value,
      pageNum: registerPage.value.pageNum,
      pageSize: registerPage.value.pageSize
    });
    if (data) {
      registerList.value = data.list;
      registerTotal.value = data.total;
    }
  } finally {
    registerLoading.value = false;
  }
};

const loadActiveList = async () => {
  activeLoading.value = true;
  try {
    const { data } = await getTodayActiveListApi({
      channelId: selectedChannel.value === 'all' ? undefined : selectedChannel.value,
      pageNum: activePage.value.pageNum,
      pageSize: activePage.value.pageSize
    });
    if (data) {
      activeList.value = data.list;
      activeTotal.value = data.total;
    }
  } finally {
    activeLoading.value = false;
  }
};

const loadPayList = async () => {
  payLoading.value = true;
  try {
    const { data } = await getTodayPayListApi({
      channelId: selectedChannel.value === 'all' ? undefined : selectedChannel.value,
      pageNum: payPage.value.pageNum,
      pageSize: payPage.value.pageSize
    });
    if (data) {
      payList.value = data.list;
      payTotal.value = data.total;
    }
  } finally {
    payLoading.value = false;
  }
};

/* ===== 交互处理 ===== */
const handleTabChange = (tabValue: string | number) => {
  activeTab.value = tabValue as string;
};

const handleChannelChange = () => {
  registerPage.value.pageNum = 1;
  activePage.value.pageNum = 1;
  payPage.value.pageNum = 1;
  loadAllData();
};

const handleReset = () => {
  selectedChannel.value = 'all';
  registerPage.value.pageNum = 1;
  activePage.value.pageNum = 1;
  payPage.value.pageNum = 1;
  loadAllData();
};

const loadAllData = () => {
  loadMetrics();
  loadRegisterList();
  loadActiveList();
  loadPayList();
};

const handleDetail = async (userId: number) => {
  const { data } = await getTodayUserDetailApi(userId);
  userDetail.value = data || null;
  detailVisible.value = true;
};

const handleMetricClick = async (type: string) => {
  const titles: Record<string, string> = {
    register: '今日注册用户趋势',
    active: '今日活跃用户趋势',
    pay: '今日支付用户趋势'
  };
  trendTitle.value = titles[type] || '趋势对比';
  trendVisible.value = true;
  trendLoading.value = true;
  try {
    const { data } = await getTrendDataApi(type as 'register' | 'active' | 'pay');
    if (data) {
      trendDataRef.value = data;
    }
  } finally {
    trendLoading.value = false;
  }
};

const handlePageChange = (tab: string, pageInfo: PageInfo) => {
  if (tab === 'register') {
    registerPage.value.pageNum = pageInfo.current;
    registerPage.value.pageSize = pageInfo.pageSize;
    loadRegisterList();
  } else if (tab === 'active') {
    activePage.value.pageNum = pageInfo.current;
    activePage.value.pageSize = pageInfo.pageSize;
    loadActiveList();
  } else if (tab === 'pay') {
    payPage.value.pageNum = pageInfo.current;
    payPage.value.pageSize = pageInfo.pageSize;
    loadPayList();
  }
};

/* ===== 趋势图 ECharts 配置 ===== */
const trendChartOption = computed<EChartsOption>(() => {
  const { today, yesterday, lastWeek } = trendDataRef.value;
  const xData = Array.from({ length: 24 }, (_, i) => `${i}时`);
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['今日', '昨日', '上周同日'],
      bottom: 0
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisLabel: { color: '#8f929e', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#8f929e', fontSize: 11 }
    },
    series: [
      {
        name: '今日',
        type: 'line',
        data: today,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2 },
        itemStyle: { color: '#0052d9' },
        areaStyle: { color: 'rgba(0,82,217,0.05)' }
      },
      {
        name: '昨日',
        type: 'line',
        data: yesterday,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2 },
        itemStyle: { color: '#00b42a' },
        areaStyle: { color: 'rgba(0,180,42,0.05)' }
      },
      {
        name: '上周同日',
        type: 'line',
        data: lastWeek,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2 },
        itemStyle: { color: '#e3a008' },
        areaStyle: { color: 'rgba(227,160,8,0.05)' }
      }
    ]
  };
});

/* ===== 初始化 ===== */
onMounted(() => {
  loadChannelOptions();
  loadMetrics();
  loadRegisterList();
});
</script>

<template>
  <div class="today-user-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">今日用户</h2>
      <span class="page-date">数据日期：{{ todayDate }}</span>
    </div>

    <!-- 核心指标卡片 -->
    <Row :gutter="[16, 16]" class="metric-cards">
      <Col :flex="1">
        <Card class="metric-card metric-card--blue" hover="shadow" @click="handleMetricClick('register')">
          <div class="metric-header">
            <span class="metric-label">今日注册用户数</span>
            <span class="metric-trend" :class="metrics.registerCompare >= 0 ? 'metric-trend--up' : 'metric-trend--down'">
              {{ metrics.registerCompare >= 0 ? '▲' : '▼' }} {{ Math.abs(metrics.registerCompare) }}%
            </span>
          </div>
          <div class="metric-value">{{ metrics.registerCount.toLocaleString() }}</div>
          <div class="metric-sub">昨日 {{ metrics.registerYesterday }} 人</div>
          <div class="metric-click-hint">📊 点击查看趋势对比</div>
        </Card>
      </Col>
      <Col :flex="1">
        <Card class="metric-card metric-card--green" hover="shadow" @click="handleMetricClick('active')">
          <div class="metric-header">
            <span class="metric-label">今日活跃用户数</span>
            <span class="metric-trend" :class="metrics.activeCompare >= 0 ? 'metric-trend--up' : 'metric-trend--down'">
              {{ metrics.activeCompare >= 0 ? '▲' : '▼' }} {{ Math.abs(metrics.activeCompare) }}%
            </span>
          </div>
          <div class="metric-value">{{ metrics.activeCount.toLocaleString() }}</div>
          <div class="metric-sub">昨日 {{ metrics.activeYesterday }} 人</div>
          <div class="metric-click-hint">📊 点击查看趋势对比</div>
        </Card>
      </Col>
      <Col :flex="1">
        <Card class="metric-card metric-card--red" hover="shadow" @click="handleMetricClick('pay')">
          <div class="metric-header">
            <span class="metric-label">今日支付用户数</span>
            <span class="metric-trend" :class="metrics.payCompare >= 0 ? 'metric-trend--up' : 'metric-trend--down'">
              {{ metrics.payCompare >= 0 ? '▲' : '▼' }} {{ Math.abs(metrics.payCompare) }}%
            </span>
          </div>
          <div class="metric-value">{{ metrics.payCount.toLocaleString() }}</div>
          <div class="metric-sub">昨日 {{ metrics.payYesterday }} 人</div>
          <div class="metric-click-hint">📊 点击查看趋势对比</div>
        </Card>
      </Col>
    </Row>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">一级渠道</label>
          <Select v-model="selectedChannel" placeholder="请选择一级渠道" clearable style="width: 200px" @change="handleChannelChange">
            <Option v-for="opt in channelOptionsList" :key="opt.value" :value="opt.value" :label="opt.label" />
          </Select>
        </div>
        <div class="btn-group">
          <Button theme="primary" @click="loadAllData">搜索</Button>
          <Button theme="default" @click="handleReset">重置</Button>
        </div>
      </div>
    </div>

    <!-- Tab 切换 + 列表 -->
    <div class="tabs-wrapper">
      <Tabs v-model="activeTab" @change="handleTabChange">
        <TabPanel value="register" :label="`今日注册用户 (${metrics.registerCount})`">
          <div class="table-toolbar">
            <span class="table-info"
              >共 <strong>{{ registerTotal }}</strong> 条记录，按注册时间倒序排列</span
            >
          </div>
          <Table
            :data="registerList"
            :columns="registerColumns"
            :loading="registerLoading"
            row-key="userId"
            :pagination="{
              current: registerPage.pageNum,
              pageSize: registerPage.pageSize,
              total: registerTotal,
              pageSizeOptions: [20, 50, 100]
            }"
            :empty="registerTotal === 0 ? '今日暂无注册用户' : ''"
            @page-change="(pageInfo: PageInfo) => handlePageChange('register', pageInfo)"
          >
            <template #channel1="{ row }">
              <Tag theme="primary" variant="light" size="small">{{ row.channel1 }}</Tag>
            </template>
            <template #channel2="{ row }">
              <Tooltip :content="row.channel2" placement="top">
                <span class="channel-text">{{ truncateChannel(row.channel2) }}</span>
              </Tooltip>
            </template>
            <template #op="{ row }">
              <a class="action-link" @click="handleDetail(row.userId)">详情</a>
            </template>
          </Table>
        </TabPanel>
        <TabPanel value="active" :label="`今日活跃用户 (${metrics.activeCount})`">
          <div class="table-toolbar">
            <span class="table-info"
              >共 <strong>{{ activeTotal }}</strong> 条记录，按首次活跃时间倒序排列</span
            >
          </div>
          <Table
            :data="activeList"
            :columns="activeColumns"
            :loading="activeLoading"
            row-key="userId"
            :pagination="{
              current: activePage.pageNum,
              pageSize: activePage.pageSize,
              total: activeTotal,
              pageSizeOptions: [20, 50, 100]
            }"
            :empty="activeTotal === 0 ? '今日暂无活跃用户' : ''"
            @page-change="(pageInfo: PageInfo) => handlePageChange('active', pageInfo)"
          >
            <template #channel1="{ row }">
              <Tag theme="primary" variant="light" size="small">{{ row.channel1 }}</Tag>
            </template>
            <template #channel2="{ row }">
              <Tooltip :content="row.channel2" placement="top">
                <span class="channel-text">{{ truncateChannel(row.channel2) }}</span>
              </Tooltip>
            </template>
            <template #op="{ row }">
              <a class="action-link" @click="handleDetail(row.userId)">详情</a>
            </template>
          </Table>
        </TabPanel>
        <TabPanel value="pay" :label="`今日支付用户 (${metrics.payCount})`">
          <div class="table-toolbar">
            <span class="table-info"
              >共 <strong>{{ payTotal }}</strong> 条记录，按首次支付时间倒序排列</span
            >
          </div>
          <Table
            :data="payList"
            :columns="payColumns"
            :loading="payLoading"
            row-key="userId"
            :pagination="{
              current: payPage.pageNum,
              pageSize: payPage.pageSize,
              total: payTotal,
              pageSizeOptions: [20, 50, 100]
            }"
            :empty="payTotal === 0 ? '今日暂无支付用户' : ''"
            @page-change="(pageInfo: PageInfo) => handlePageChange('pay', pageInfo)"
          >
            <template #channel1="{ row }">
              <Tag theme="primary" variant="light" size="small">{{ row.channel1 }}</Tag>
            </template>
            <template #channel2="{ row }">
              <Tooltip :content="row.channel2" placement="top">
                <span class="channel-text">{{ truncateChannel(row.channel2) }}</span>
              </Tooltip>
            </template>
            <template #op="{ row }">
              <a class="action-link" @click="handleDetail(row.userId)">详情</a>
            </template>
          </Table>
        </TabPanel>
      </Tabs>
    </div>

    <!-- 用户详情弹窗 -->
    <Dialog v-model:visible="detailVisible" header="用户详情" width="520px" :confirm-btn="null">
      <template #footer>
        <Button theme="default" @click="detailVisible = false">关闭</Button>
      </template>
      <div v-if="userDetail" class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">用户 ID</span>
          <span class="detail-value detail-value--mono">{{ userDetail.userId }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">用户名称</span>
          <span class="detail-value">{{ userDetail.userName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">昵称</span>
          <span class="detail-value">{{ userDetail.nickname }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">手机号</span>
          <span class="detail-value">{{ userDetail.phone }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">一级渠道</span>
          <span class="detail-value">{{ userDetail.channel1 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">二级渠道</span>
          <span class="detail-value">{{ userDetail.channel2 }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">注册时间</span>
          <span class="detail-value">{{ userDetail.registerTime }}</span>
        </div>
      </div>
    </Dialog>

    <!-- 趋势图弹窗 -->
    <Dialog v-model:visible="trendVisible" :header="trendTitle" width="720px" :confirm-btn="null">
      <template #footer>
        <Button theme="default" @click="trendVisible = false">关闭</Button>
      </template>
      <div v-if="trendLoading" class="trend-chart-loading">
        <Loading size="large" text="加载中..." />
      </div>
      <div v-else-if="trendDataRef.today.length > 0" class="trend-chart">
        <VChart class="trend-chart-instance" :option="trendChartOption" autoresize />
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.today-user-page {
  padding: 24px;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }

    .page-date {
      font-size: 13px;
      color: var(--td-text-color-placeholder);
    }
  }

  .metric-cards {
    margin-bottom: 16px;
  }

  .metric-card {
    cursor: pointer;

    :deep(.t-card__body) {
      padding: 20px 24px;
    }

    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .metric-label {
        font-size: 14px;
        color: var(--td-text-color-placeholder);
      }

      .metric-trend {
        font-size: 12px;

        &.metric-trend--up {
          color: var(--td-success-color);
        }

        &.metric-trend--down {
          color: var(--td-error-color);
        }
      }
    }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--td-text-color-primary);
      line-height: 1;
    }

    .metric-sub {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
      margin-top: 6px;
    }

    .metric-click-hint {
      font-size: 11px;
      color: #cbd5e1;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    &:hover .metric-click-hint {
      color: var(--td-brand-color);
    }

    &.metric-card--blue .metric-value {
      color: var(--td-brand-color);
    }

    &.metric-card--green .metric-value {
      color: var(--td-success-color);
    }

    &.metric-card--red .metric-value {
      color: var(--td-error-color);
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

  .tabs-wrapper {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    border: 1px solid var(--td-component-stroke);
    overflow: hidden;

    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--td-component-stroke);

      .table-info {
        font-size: 13px;
        color: var(--td-text-color-placeholder);
      }
    }

    .action-link {
      color: var(--td-brand-color);
      cursor: pointer;
      text-decoration: none;
      font-size: 13px;

      &:hover {
        text-decoration: underline;
      }
    }

    .channel-text {
      display: inline-block;
      max-width: 10em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* 用户详情弹窗 */
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 24px;

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .detail-label {
        font-size: 12px;
        color: var(--td-text-color-placeholder);
      }

      .detail-value {
        font-size: 14px;
        color: var(--td-text-color-primary);

        &.detail-value--mono {
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
          color: var(--td-text-color-placeholder);
        }
      }
    }
  }

  /* 趋势图弹窗 */
  .trend-chart-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 320px;
  }

  .trend-chart {
    .trend-chart-instance {
      width: 100%;
      height: 320px;
    }
  }
}
</style>
