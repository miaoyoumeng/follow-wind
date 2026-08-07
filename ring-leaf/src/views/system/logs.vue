<script setup lang="ts" name="LogAuditList">
import { ref, onMounted } from 'vue';
import { Select, Option, Button, Tag } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import { getOperationLogListApi } from '@/api/operationLog.ts';
import type { OperationLog } from '@/api/modules/operation-log.ts';

/* ===== 列表数据 ===== */
const tableData = ref<OperationLog.LogItem[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);

/* ===== 筛选条件 ===== */
const searchOperator = ref('all');
const searchModule = ref('all');
const searchType = ref('all');
const searchDateRange = ref<string[]>([]);

/* ===== 选项 ===== */
const operatorOptions = [
  { value: 'all', label: '全部' },
  { value: '张三', label: '张三' },
  { value: '李四', label: '李四' },
  { value: '王五', label: '王五' }
];

const moduleOptions = [
  { value: 'all', label: '全部' },
  { value: '员工管理', label: '员工管理' },
  { value: '商品管理', label: '商品管理' },
  { value: '订单管理', label: '订单管理' },
  { value: '登录', label: '登录' },
  { value: '用户管理', label: '用户管理' },
  { value: '财务管理', label: '财务管理' },
  { value: '消息管理', label: '消息管理' },
  { value: '系统设置', label: '系统设置' }
];

const typeOptions = [
  { value: 'all', label: '全部' },
  { value: '登录', label: '登录' },
  { value: '新增', label: '新增' },
  { value: '修改', label: '修改' },
  { value: '删除', label: '删除' },
  { value: '启用', label: '启用' },
  { value: '停用', label: '停用' }
];

/* ===== 操作类型颜色映射 ===== */
const getTypeTagTheme = (type: string) => {
  if (type === '登录' || type === '新增' || type === '启用') return 'primary';
  if (type === '修改' || type === '停用') return 'warning';
  if (type === '删除') return 'danger';
  return 'default';
};

/* ===== 加载列表 ===== */
const loadData = async () => {
  let dateRange: [string, string] | undefined;
  if (searchDateRange.value && searchDateRange.value.length === 2) {
    dateRange = [searchDateRange.value[0], searchDateRange.value[1]];
  }

  const { data } = await getOperationLogListApi({
    operatorName: searchOperator.value !== 'all' ? searchOperator.value : undefined,
    module: searchModule.value !== 'all' ? searchModule.value : undefined,
    operateType: searchType.value !== 'all' ? searchType.value : undefined,
    dateRange,
    pageNum: pageNum.value,
    pageSize: pageSize.value
  });
  if (data) {
    tableData.value = data.list;
    total.value = data.total;
  }
};

/* ===== 搜索 ===== */
const handleSearch = () => {
  pageNum.value = 1;
  loadData();
};

/* ===== 重置 ===== */
const handleReset = () => {
  searchOperator.value = 'all';
  searchModule.value = 'all';
  searchType.value = 'all';
  searchDateRange.value = [];
  pageNum.value = 1;
  loadData();
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  pageNum.value = pageInfo.current;
  pageSize.value = pageInfo.pageSize;
  loadData();
};

/* ===== 表格列 ===== */
const columns: PrimaryTableCol<OperationLog.LogItem>[] = [
  { colKey: 'operateTime', title: '时间', width: 180 },
  { colKey: 'operatorName', title: '操作人', width: 100 },
  { colKey: 'module', title: '模块', width: 120 },
  { colKey: 'operateType', title: '操作类型', width: 100 },
  { colKey: 'content', title: '操作内容', ellipsis: true }
];

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="system-page">
    <div class="page-header">
      <h2 class="page-title">日志列表</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">操作人</span>
        <Select v-model="searchOperator" placeholder="全部" clearable>
          <Option v-for="opt in operatorOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">模块</span>
        <Select v-model="searchModule" placeholder="全部" clearable>
          <Option v-for="opt in moduleOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">操作类型</span>
        <Select v-model="searchType" placeholder="全部" clearable>
          <Option v-for="opt in typeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">时间范围</span>
        <t-date-range-picker v-model="searchDateRange" clearable allow-input format="YYYY-MM-DD" />
      </div>
      <div class="filter-actions">
        <Button theme="primary" @click="handleSearch">搜索</Button>
        <Button variant="outline" @click="handleReset">重置</Button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-card">
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        :hover="true"
        :stripe="false"
        :bordered="false"
        :pagination="{
          current: pageNum,
          pageSize: pageSize,
          total: total,
          showJumper: true,
          showPageSize: true
        }"
        @page-change="handlePageChange"
        empty="暂无操作日志"
      >
        <template #operateType="{ row }">
          <Tag :theme="getTypeTagTheme(row.operateType)" variant="light">{{ row.operateType }}</Tag>
        </template>
      </t-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  padding: 24px;

  .page-header {
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
        color: var(--td-text-color-placeholder);
      }
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      align-self: flex-end;
    }
  }

  .table-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 16px;
  }
}
</style>
