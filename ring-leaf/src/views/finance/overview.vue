<script setup lang="ts" name="FinanceOverview">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import type { EChartsOption } from 'echarts';
import { getFinanceOverviewApi } from '@/api/modules/finance-overview';
import type { FinanceOverview } from '@/api/modules/finance-overview';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import mockData from '@/assets/jsons/finance-overview.json';

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

/* ===== 筛选条件 ===== */
const filterApp = ref('all');
const timeRange = ref('month');

/* ===== 数据状态 ===== */
const loading = ref(false);
const overviewData = ref<FinanceOverview.OverviewData>({
  todayMetrics: { todayRevenue: 0, todayConfirmed: 0, todayRefund: 0, todayOrder: 0 },
  monthSummary: { monthRevenue: 0, monthConfirmed: 0, monthRefund: 0, pendingConfirmed: 0 },
  trendData: [],
  appRevenueList: []
});

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getFinanceOverviewApi({
      appId: filterApp.value === 'all' ? undefined : filterApp.value,
      timeRange: timeRange.value
    });
    overviewData.value = data;
  } catch {
    overviewData.value = mockData.data;
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  loadData();
};

/* ===== 金额格式化 ===== */
const formatAmount = (val: number) => {
  return val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const appColumns: PrimaryTableCol<FinanceOverview.AppRevenueItem>[] = [
  { colKey: 'appName', title: 'App名称', width: 160 },
  { colKey: 'revenue', title: '营收金额', width: 160 },
  { colKey: 'percentage', title: '占比', width: 100 },
  { colKey: 'confirmed', title: '确收金额', width: 160 },
  { colKey: 'refund', title: '退款金额' }
];

/* ===== 折线图配置 ===== */
const chartOption = computed<EChartsOption>(() => {
  const trend = overviewData.value.trendData;
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = params[0].axisValue + '<br/>';
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: ¥${formatAmount(p.value)}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['营收金额', '确收金额', '退款金额'],
      bottom: 0
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: trend.map(t => t.date),
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisLabel: { color: '#8f929e' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: {
        color: '#8f929e',
        formatter: (v: number) => `¥${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
      }
    },
    series: [
      {
        name: '营收金额',
        type: 'line',
        data: trend.map(t => t.revenue),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        itemStyle: { color: '#0052d9' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,82,217,0.15)' },
              { offset: 1, color: 'rgba(0,82,217,0.02)' }
            ]
          }
        }
      },
      {
        name: '确收金额',
        type: 'line',
        data: trend.map(t => t.confirmed),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        itemStyle: { color: '#00b42a' }
      },
      {
        name: '退款金额',
        type: 'line',
        data: trend.map(t => t.refund),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        itemStyle: { color: '#f53f3f' }
      }
    ]
  };
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="finance-overview-page">
    <h1 class="page-title">财务概览</h1>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">App 筛选</span>
        <t-select v-model="filterApp" @change="handleFilterChange" style="width: 160px">
          <t-option value="all" label="全部" />
          <t-option value="shenbi" label="神笔马良" />
          <t-option value="app-b" label="App B" />
        </t-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">时间范围</span>
        <t-select v-model="timeRange" @change="handleFilterChange" style="width: 160px">
          <t-option value="today" label="今日" />
          <t-option value="week" label="近7日" />
          <t-option value="month" label="本月" />
        </t-select>
      </div>
    </div>

    <!-- 摘要卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-label">本月营收</div>
        <div class="summary-value value-blue">¥{{ formatAmount(overviewData.monthSummary.monthRevenue) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">本月确收</div>
        <div class="summary-value value-green">¥{{ formatAmount(overviewData.monthSummary.monthConfirmed) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">本月退款</div>
        <div class="summary-value value-red">¥{{ formatAmount(overviewData.monthSummary.monthRefund) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">待确收金额</div>
        <div class="summary-value value-orange">¥{{ formatAmount(overviewData.monthSummary.pendingConfirmed) }}</div>
      </div>
    </div>

    <!-- 趋势图 -->
    <div class="chart-card">
      <h2 class="chart-title">近30日营收趋势</h2>
      <div v-if="loading" class="chart-loading">加载中...</div>
      <v-chart v-else class="chart-container" :option="chartOption" autoresize />
    </div>

    <!-- App 营收占比 -->
    <div class="table-card">
      <h2 class="chart-title">各 App 营收占比</h2>
      <t-table :data="overviewData.appRevenueList" row-key="appName" :hover="true" :stripe="false" :bordered="false" :columns="appColumns">
        <template #col-revenue="{ row }"> ¥{{ formatAmount(row.revenue) }} </template>
        <template #col-percentage="{ row }"> {{ row.percentage }}% </template>
        <template #col-confirmed="{ row }"> ¥{{ formatAmount(row.confirmed) }} </template>
        <template #col-refund="{ row }"> ¥{{ formatAmount(row.refund) }} </template>
      </t-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.finance-overview-page {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
    margin-bottom: 24px;
  }

  .filter-bar {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
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
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

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
      }

      .value-blue {
        color: #0052d9;
      }
      .value-green {
        color: #00b42a;
      }
      .value-red {
        color: #f53f3f;
      }
      .value-orange {
        color: #ff7d00;
      }
    }
  }

  .chart-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #1d2129;
      margin-bottom: 16px;
    }

    .chart-container {
      height: 300px;
    }

    .chart-loading {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8f929e;
    }
  }

  .table-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #1d2129;
      margin-bottom: 16px;
    }
  }
}
</style>
