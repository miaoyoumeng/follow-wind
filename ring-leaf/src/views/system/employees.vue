<script setup lang="ts" name="EmployeeList">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Dialog, Tag, Input, Select, Option, Button } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import { getEmployeeListApi, getEmployeeDetailApi, updateEmployeeApi } from '@/api/employee.ts';
import type { EmployeeList } from '@/api/modules/employee.ts';

/* ===== 列表数据 ===== */
const tableData = ref<EmployeeList.EmployeeItem[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);

/* ===== 筛选条件 ===== */
const searchName = ref('');
const searchId = ref('');
const searchRole = ref('all');
const searchStatus = ref('all');

/* ===== 详情弹窗 ===== */
const detailDialogVisible = ref(false);
const detailData = ref<EmployeeList.EmployeeItem | null>(null);

/* ===== 编辑弹窗 ===== */
const editDialogVisible = ref(false);
const editForm = ref<EmployeeList.UpdateParams>({
  id: 0,
  name: '',
  phone: '',
  role: 'operator',
  joinDate: '',
  apps: [],
  status: 'active'
});
const editFormError = ref('');

/* ===== 角色选项 ===== */
const roleOptions = [
  { value: 'admin', label: '管理者' },
  { value: 'operator', label: 'App 运营人员' }
];

/* ===== App 选项 ===== */
const appOptions = [
  { value: '神笔马良', label: '神笔马良' },
  { value: 'AppB', label: 'AppB' }
];

/* ===== 加载列表 ===== */
const loadData = async () => {
  const { data } = await getEmployeeListApi({
    name: searchName.value || undefined,
    id: searchId.value ? Number(searchId.value) : undefined,
    role: searchRole.value,
    status: searchStatus.value,
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

const handleReset = () => {
  searchName.value = '';
  searchId.value = '';
  searchRole.value = 'all';
  searchStatus.value = 'all';
  pageNum.value = 1;
  loadData();
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  pageNum.value = pageInfo.current;
  pageSize.value = pageInfo.pageSize;
  loadData();
};

/* ===== 查看详情 ===== */
const handleDetail = async (row: EmployeeList.EmployeeItem) => {
  const { data } = await getEmployeeDetailApi({ id: row.id });
  if (data) {
    detailData.value = data;
    detailDialogVisible.value = true;
  }
};

/* ===== 编辑 ===== */
const handleEdit = () => {
  if (!detailData.value) return;
  editForm.value = {
    id: detailData.value.id,
    name: detailData.value.name,
    phone: detailData.value.phone,
    role: detailData.value.role,
    joinDate: detailData.value.joinDate,
    apps: [...detailData.value.apps.filter(a => a !== '全部')],
    status: detailData.value.status
  };
  editFormError.value = '';
  editDialogVisible.value = true;
};

/* ===== 保存编辑 ===== */
const confirmSaveEdit = async () => {
  if (!editForm.value.name.trim() || editForm.value.name.length < 2 || editForm.value.name.length > 20) {
    editFormError.value = '姓名长度为 2-20 字符';
    return;
  }
  if (!/^1\d{10}$/.test(editForm.value.phone)) {
    editFormError.value = '请输入合法的11位手机号';
    return;
  }
  if (!editForm.value.joinDate) {
    editFormError.value = '请选择入职日期';
    return;
  }
  if (editForm.value.role === 'admin' && editForm.value.status === 'inactive') {
    editFormError.value = '管理者角色不可被停用';
    return;
  }

  try {
    await updateEmployeeApi(editForm.value);
    MessagePlugin.success('员工信息已更新');
    editDialogVisible.value = false;
    detailDialogVisible.value = false;
    loadData();
  } catch (e: any) {
    editFormError.value = e.message;
  }
};

/* ===== 工具方法 ===== */
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
};

const maskWechat = (name: string) => {
  if (!name) return '-';
  return name.charAt(0) + '*';
};

const formatApps = (apps: string[]) => {
  if (!apps || apps.length === 0) return '-';
  if (apps.includes('全部')) return '全部';
  return apps.join('、');
};

const getRoleTagTheme = (role: string) => {
  return role === 'admin' ? 'primary' : 'warning';
};

const getStatusTagTheme = (status: string) => {
  return status === 'active' ? 'success' : 'default';
};

const getStatusLabel = (status: string) => {
  return status === 'active' ? '启用' : '停用';
};

const getRoleLabel = (role: string) => {
  return role === 'admin' ? '管理者' : 'App 运营人员';
};

/* ===== 表格列 ===== */
const columns: PrimaryTableCol<EmployeeList.EmployeeItem>[] = [
  { colKey: 'id', title: '员工ID', width: 90 },
  { colKey: 'username', title: '用户名', width: 120 },
  { colKey: 'name', title: '姓名', width: 100 },
  { colKey: 'phone', title: '手机号', width: 140 },
  { colKey: 'wechatNickname', title: '绑定微信', width: 120 },
  { colKey: 'role', title: '角色', width: 130 },
  { colKey: 'joinDate', title: '入职日期', width: 120 },
  { colKey: 'apps', title: '负责App', width: 150 },
  { colKey: 'status', title: '状态', width: 90 },
  { colKey: 'row-operation', title: '操作', width: 80, fixed: 'right' }
];

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="employee-page">
    <div class="page-header">
      <h2 class="page-title">员工列表</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">姓名</span>
        <Input v-model="searchName" placeholder="请输入姓名" clearable @enter="handleSearch" />
      </div>
      <div class="filter-item">
        <span class="filter-label">员工ID</span>
        <Input v-model="searchId" placeholder="请输入员工ID" clearable @enter="handleSearch" />
      </div>
      <div class="filter-item">
        <span class="filter-label">角色</span>
        <Select v-model="searchRole" placeholder="全部" clearable>
          <Option value="all" label="全部" />
          <Option value="admin" label="管理者" />
          <Option value="operator" label="App 运营人员" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">状态</span>
        <Select v-model="searchStatus" placeholder="全部" clearable>
          <Option value="all" label="全部" />
          <Option value="active" label="启用" />
          <Option value="inactive" label="停用" />
        </Select>
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
        empty="暂无员工"
      >
        <template #phone="{ row }">
          {{ maskPhone(row.phone) }}
        </template>
        <template #wechatNickname="{ row }">
          {{ maskWechat(row.wechatNickname) }}
        </template>
        <template #role="{ row }">
          <Tag :theme="getRoleTagTheme(row.role)" variant="light">{{ getRoleLabel(row.role) }}</Tag>
        </template>
        <template #apps="{ row }">
          {{ formatApps(row.apps) }}
        </template>
        <template #status="{ row }">
          <Tag :theme="getStatusTagTheme(row.status)" variant="light">{{ getStatusLabel(row.status) }}</Tag>
        </template>
        <template #row-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">详情</a>
        </template>
      </t-table>
    </div>

    <!-- 员工详情弹窗 -->
    <Dialog v-model:visible="detailDialogVisible" header="员工详情" width="480px" attach="body" :confirm-btn="null">
      <template #footer>
        <div class="detail-footer">
          <Button variant="outline" @click="handleEdit">编辑</Button>
          <Button @click="detailDialogVisible = false">关闭</Button>
        </div>
      </template>
      <div v-if="detailData" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">员工 ID</span>
          <span class="detail-value">{{ detailData.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">用户名</span>
          <span class="detail-value">{{ detailData.username }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">姓名</span>
          <span class="detail-value">{{ detailData.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">手机号</span>
          <span class="detail-value">{{ maskPhone(detailData.phone) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">绑定微信</span>
          <span class="detail-value">{{ maskWechat(detailData.wechatNickname) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">角色</span>
          <span class="detail-value">
            <Tag :theme="getRoleTagTheme(detailData.role)" variant="light">{{ getRoleLabel(detailData.role) }}</Tag>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">入职日期</span>
          <span class="detail-value">{{ detailData.joinDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">负责 App</span>
          <span class="detail-value">{{ formatApps(detailData.apps) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span class="detail-value">
            <Tag :theme="getStatusTagTheme(detailData.status)" variant="light">{{ getStatusLabel(detailData.status) }}</Tag>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建人</span>
          <span class="detail-value">{{ detailData.createdBy }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建时间</span>
          <span class="detail-value">{{ detailData.createdAt }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">更新人</span>
          <span class="detail-value">{{ detailData.updatedBy }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">更新时间</span>
          <span class="detail-value">{{ detailData.updatedAt }}</span>
        </div>
      </div>
    </Dialog>

    <!-- 编辑员工弹窗 -->
    <Dialog v-model:visible="editDialogVisible" header="编辑员工" width="480px" attach="body" @confirm="confirmSaveEdit">
      <div class="edit-form">
        <div class="edit-row">
          <span class="edit-label">员工 ID</span>
          <span class="edit-value">{{ editForm.id }}</span>
        </div>
        <div class="edit-row">
          <span class="edit-label">用户名</span>
          <span class="edit-value">{{ tableData.find(e => e.id === editForm.id)?.username || '' }}</span>
        </div>
        <div class="edit-row edit-input-row">
          <span class="edit-label">姓名</span>
          <Input v-model="editForm.name" placeholder="请输入姓名" />
        </div>
        <div class="edit-row edit-input-row">
          <span class="edit-label">手机号</span>
          <Input v-model="editForm.phone" placeholder="请输入手机号" />
        </div>
        <div class="edit-row edit-input-row">
          <span class="edit-label">角色</span>
          <t-radio-group v-model="editForm.role">
            <t-radio v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</t-radio>
          </t-radio-group>
        </div>
        <div class="edit-row edit-input-row">
          <span class="edit-label">入职日期</span>
          <t-date-picker v-model="editForm.joinDate" allow-input clearable />
        </div>
        <div class="edit-row edit-input-row">
          <span class="edit-label">负责 App</span>
          <t-checkbox-group v-model="editForm.apps">
            <t-checkbox v-for="opt in appOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</t-checkbox>
          </t-checkbox-group>
        </div>
        <div class="edit-row edit-input-row">
          <span class="edit-label">状态</span>
          <t-radio-group v-model="editForm.status">
            <t-radio value="active">启用</t-radio>
            <t-radio value="inactive">停用</t-radio>
          </t-radio-group>
        </div>
        <div v-if="editFormError" class="form-error">{{ editFormError }}</div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.employee-page {
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

  /* ===== 详情弹窗 ===== */
  .detail-content {
    padding: 8px 0;

    .detail-row {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--td-component-stroke);

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        width: 90px;
        font-size: 14px;
        color: var(--td-text-color-placeholder);
        flex-shrink: 0;
      }

      .detail-value {
        flex: 1;
        font-size: 14px;
        color: var(--td-text-color-primary);
      }
    }
  }

  .detail-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  /* ===== 编辑弹窗 ===== */
  .edit-form {
    padding: 8px 0;

    .edit-row {
      display: flex;
      align-items: center;
      padding: 10px 0;

      .edit-label {
        width: 90px;
        font-size: 14px;
        color: var(--td-text-color-placeholder);
        flex-shrink: 0;
      }

      .edit-value {
        flex: 1;
        font-size: 14px;
        color: var(--td-text-color-primary);
      }

      &.edit-input-row {
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;

        .edit-label {
          width: auto;
        }
      }
    }

    .form-error {
      color: var(--td-error-color);
      font-size: 12px;
      margin-top: 8px;
    }
  }
}
</style>
