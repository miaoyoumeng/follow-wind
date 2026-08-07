<script setup lang="ts" name="UserList">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { UserFilledIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import {
  getActiveUserListApi,
  getCancelledUserListApi,
  getUserDetailApi,
  cancelUserApi,
  blacklistUserApi,
  getChannelOptionsApi
} from '@/api/user.ts';
import type { UserList } from '@/api/modules/user.ts';

/* ===== Tab 切换 ===== */
const activeTab = ref<'active' | 'cancelled'>('active');

/* ===== 有效用户筛选 ===== */
const activeFilter = ref({
  channel1: 'all',
  userId: '',
  userName: '',
  phone: '',
  dateRange: [] as string[]
});

/* ===== 注销用户筛选 ===== */
const cancelledFilter = ref({
  userId: '',
  userName: '',
  phone: '',
  dateRange: [] as string[]
});

/* ===== 渠道选项 ===== */
const channelOptionsList = ref<Array<{ value: string; label: string }>>([]);

/* ===== 列表数据 ===== */
const activeTableData = ref<UserList.UserItem[]>([]);
const cancelledTableData = ref<UserList.UserItem[]>([]);
const activeTotal = ref(0);
const cancelledTotal = ref(0);
const loading = ref(false);
const activePage = ref({ pageNum: 1, pageSize: 20 });
const cancelledPage = ref({ pageNum: 1, pageSize: 20 });

/* ===== 用户详情弹窗 ===== */
const detailVisible = ref(false);
const userDetail = ref<UserList.UserDetail | null>(null);
const phoneRevealed = ref(false);

/* ===== 确认弹窗 ===== */
const confirmVisible = ref(false);
const confirmType = ref<'cancel' | 'blacklist'>('cancel');
const confirmUserId = ref(0);
const confirmUserName = ref('');

/* ===== 二级渠道截断 ===== */
const truncateChannel = (text: string, maxLen = 10): string => {
  if (!text || text === '—') return text || '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

/* ===== 性别映射 ===== */
const genderMap: Record<string, { label: string; icon: string }> = {
  male: { label: '男', icon: '♂' },
  female: { label: '女', icon: '♀' },
  unknown: { label: '未知', icon: '' },
  '': { label: '—', icon: '' }
};

/* ===== 状态映射 ===== */
const statusMap: Record<string, { label: string; theme: 'success' | 'danger' | 'default' }> = {
  normal: { label: '正常', theme: 'success' },
  cancelled: { label: '注销', theme: 'default' },
  blacklisted: { label: '拉黑', theme: 'danger' }
};

/* ===== 有效用户表格列 ===== */
const activeColumns: PrimaryTableCol[] = [
  { colKey: 'avatar', title: '头像', width: 80 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 140 },
  { colKey: 'nickname', title: '昵称', width: 120 },
  { colKey: 'phone', title: '手机号', width: 140 },
  { colKey: 'wechatNickname', title: '微信昵称', width: 120 },
  { colKey: 'wechatGender', title: '性别', width: 80 },
  { colKey: 'channel1', title: '一级渠道', width: 100 },
  { colKey: 'registerTime', title: '注册时间', width: 180 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'role', title: '角色', width: 100 },
  { colKey: 'channel2', title: '二级渠道', ellipsis: true, width: 200 },
  { colKey: 'op', title: '操作', width: 150, fixed: 'right' }
];

/* ===== 注销用户表格列 ===== */
const cancelledColumns: PrimaryTableCol[] = [
  { colKey: 'avatar', title: '头像', width: 80 },
  { colKey: 'userId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 140 },
  { colKey: 'nickname', title: '昵称', width: 120 },
  { colKey: 'phone', title: '手机号', width: 140 },
  { colKey: 'wechatNickname', title: '微信昵称', width: 120 },
  { colKey: 'wechatGender', title: '性别', width: 80 },
  { colKey: 'channel1', title: '一级渠道', width: 100 },
  { colKey: 'registerTime', title: '注册时间', width: 180 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'role', title: '角色', width: 100 },
  { colKey: 'cancelledTime', title: '注销时间', width: 180 }
];

/* ===== 数据加载 ===== */
const loadChannelOptions = async () => {
  const { data } = await getChannelOptionsApi();
  if (data) {
    channelOptionsList.value = data;
  }
};

const loadActiveData = async () => {
  loading.value = true;
  try {
    const params: UserList.ActiveListParams = {
      channel1: activeFilter.value.channel1 === 'all' ? undefined : activeFilter.value.channel1,
      userId: activeFilter.value.userId || undefined,
      userName: activeFilter.value.userName || undefined,
      phone: activeFilter.value.phone || undefined,
      registerStartDate: activeFilter.value.dateRange?.[0],
      registerEndDate: activeFilter.value.dateRange?.[1],
      pageNum: activePage.value.pageNum,
      pageSize: activePage.value.pageSize
    };
    const { data } = await getActiveUserListApi(params);
    if (data) {
      activeTableData.value = data.list;
      activeTotal.value = data.total;
    }
  } finally {
    loading.value = false;
  }
};

const loadCancelledData = async () => {
  loading.value = true;
  try {
    const params: UserList.CancelledListParams = {
      userId: cancelledFilter.value.userId || undefined,
      userName: cancelledFilter.value.userName || undefined,
      phone: cancelledFilter.value.phone || undefined,
      cancelledStartDate: cancelledFilter.value.dateRange?.[0],
      cancelledEndDate: cancelledFilter.value.dateRange?.[1],
      pageNum: cancelledPage.value.pageNum,
      pageSize: cancelledPage.value.pageSize
    };
    const { data } = await getCancelledUserListApi(params);
    if (data) {
      cancelledTableData.value = data.list;
      cancelledTotal.value = data.total;
    }
  } finally {
    loading.value = false;
  }
};

const loadData = () => {
  if (activeTab.value === 'active') {
    loadActiveData();
  } else {
    loadCancelledData();
  }
};

/* ===== Tab 切换 ===== */
const handleTabChange = (tab: 'active' | 'cancelled') => {
  activeTab.value = tab;
  loadData();
};

/* ===== 搜索 ===== */
const handleSearch = () => {
  if (activeTab.value === 'active') {
    activePage.value.pageNum = 1;
  } else {
    cancelledPage.value.pageNum = 1;
  }
  loadData();
};

/* ===== 重置 ===== */
const handleReset = () => {
  if (activeTab.value === 'active') {
    activeFilter.value = { channel1: 'all', userId: '', userName: '', phone: '', dateRange: [] };
    activePage.value.pageNum = 1;
  } else {
    cancelledFilter.value = { userId: '', userName: '', phone: '', dateRange: [] };
    cancelledPage.value.pageNum = 1;
  }
  loadData();
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  if (activeTab.value === 'active') {
    activePage.value.pageNum = pageInfo.current;
    activePage.value.pageSize = pageInfo.pageSize;
  } else {
    cancelledPage.value.pageNum = pageInfo.current;
    cancelledPage.value.pageSize = pageInfo.pageSize;
  }
  loadData();
};

/* ===== 用户详情 ===== */
const handleDetail = async (userId: number) => {
  phoneRevealed.value = false;
  const { data } = await getUserDetailApi(userId);
  userDetail.value = data || null;
  detailVisible.value = true;
};

/* ===== 切换手机号显示 ===== */
const togglePhone = () => {
  if (!userDetail.value) return;
  phoneRevealed.value = !phoneRevealed.value;
  if (phoneRevealed.value) {
    MessagePlugin.info('已显示真实手机号');
  }
};

/* ===== 注销/拉黑 ===== */
const handleCancel = (userId: number, userName: string) => {
  confirmType.value = 'cancel';
  confirmUserId.value = userId;
  confirmUserName.value = userName;
  confirmVisible.value = true;
};

const handleBlacklist = (userId: number, userName: string) => {
  confirmType.value = 'blacklist';
  confirmUserId.value = userId;
  confirmUserName.value = userName;
  confirmVisible.value = true;
};

const isDisabled = (status: string, type: 'cancel' | 'blacklist'): boolean => {
  if (type === 'cancel') return status === 'cancelled' || status === 'blacklisted';
  return status === 'blacklisted' || status === 'cancelled';
};

const handleConfirm = async () => {
  try {
    if (confirmType.value === 'cancel') {
      await cancelUserApi({ userId: confirmUserId.value });
      MessagePlugin.success('注销成功');
    } else {
      await blacklistUserApi({ userId: confirmUserId.value });
      MessagePlugin.success('拉黑成功');
    }
    confirmVisible.value = false;
    loadData();
  } catch {
    MessagePlugin.error('操作失败');
  }
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadChannelOptions();
  loadActiveData();
});
</script>

<template>
  <div class="user-list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">用户列表</h2>
    </div>

    <!-- Tabs 切换 -->
    <div class="tabs-container">
      <t-tabs v-model="activeTab" @change="handleTabChange">
        <t-tab-panel value="active" label="有效用户" />
        <t-tab-panel value="cancelled" label="注销用户" />
      </t-tabs>
    </div>

    <!-- 有效用户筛选栏 -->
    <div v-show="activeTab === 'active'" class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">一级渠道</label>
          <t-select v-model="activeFilter.channel1" placeholder="请选择一级渠道" clearable style="width: 180px">
            <t-option value="all" label="全部" />
            <t-option v-for="opt in channelOptionsList" :key="opt.value" :value="opt.value" :label="opt.label" />
          </t-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">用户ID</label>
          <t-input v-model="activeFilter.userId" placeholder="请输入用户ID" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">用户名称</label>
          <t-input v-model="activeFilter.userName" placeholder="请输入用户名称" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">手机号</label>
          <t-input v-model="activeFilter.phone" placeholder="请输入手机号" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">注册时间</label>
          <t-date-range-picker v-model="activeFilter.dateRange" placeholder="请选择日期范围" style="width: 260px" allow-input clearable />
        </div>
        <div class="btn-group">
          <t-button theme="primary" @click="handleSearch">搜索</t-button>
          <t-button theme="default" variant="outline" @click="handleReset">重置</t-button>
        </div>
      </div>
    </div>

    <!-- 注销用户筛选栏 -->
    <div v-show="activeTab === 'cancelled'" class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">用户ID</label>
          <t-input v-model="cancelledFilter.userId" placeholder="请输入用户ID" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">用户名称</label>
          <t-input v-model="cancelledFilter.userName" placeholder="请输入用户名称" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">手机号</label>
          <t-input v-model="cancelledFilter.phone" placeholder="请输入手机号" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">注销时间</label>
          <t-date-range-picker v-model="cancelledFilter.dateRange" placeholder="请选择日期范围" style="width: 260px" allow-input clearable />
        </div>
        <div class="btn-group">
          <t-button theme="primary" @click="handleSearch">搜索</t-button>
          <t-button theme="default" variant="outline" @click="handleReset">重置</t-button>
        </div>
      </div>
    </div>

    <!-- 有效用户表格 -->
    <div v-show="activeTab === 'active'" class="table-card">
      <t-table
        :data="activeTableData"
        :columns="activeColumns"
        :loading="loading"
        row-key="userId"
        :pagination="{
          current: activePage.pageNum,
          pageSize: activePage.pageSize,
          total: activeTotal,
          pageSizeOptions: [20, 50, 100]
        }"
        :empty="activeTableData.length === 0 ? '暂无用户' : ''"
        @page-change="handlePageChange"
      >
        <template #avatar="{ row }">
          <t-avatar v-if="row.avatar" :image="row.avatar" size="32px" />
          <t-avatar v-else size="32px">
            <template #icon><UserFilledIcon /></template>
          </t-avatar>
        </template>

        <template #userName="{ row }">
          <a class="user-name-link" @click="handleDetail(row.userId)">{{ row.userName }}</a>
        </template>

        <template #phone="{ row }">
          {{ row.phone }}
        </template>

        <template #wechatNickname="{ row }">
          {{ row.wechatNickname || '—' }}
        </template>

        <template #wechatGender="{ row }">
          <span v-if="genderMap[row.wechatGender]?.label !== '—'" :class="`gender-${row.wechatGender}`">
            {{ genderMap[row.wechatGender]?.icon }} {{ genderMap[row.wechatGender]?.label }}
          </span>
          <span v-else class="gender-unknown">—</span>
        </template>

        <template #status="{ row }">
          <t-tag v-if="statusMap[row.status]" :theme="statusMap[row.status].theme" variant="light" size="small">
            {{ statusMap[row.status].label }}
          </t-tag>
          <span v-else>{{ row.status }}</span>
        </template>

        <template #channel2="{ row }">
          <t-tooltip :content="row.channel2" placement="top">
            <span class="channel-text">{{ truncateChannel(row.channel2) }}</span>
          </t-tooltip>
        </template>

        <template #op="{ row }">
          <div class="action-group">
            <t-button
              variant="text"
              theme="warning"
              size="small"
              :disabled="isDisabled(row.status, 'cancel')"
              @click="handleCancel(row.userId, row.userName)"
            >
              注销
            </t-button>
            <t-button
              variant="text"
              theme="danger"
              size="small"
              :disabled="isDisabled(row.status, 'blacklist')"
              @click="handleBlacklist(row.userId, row.userName)"
            >
              拉黑
            </t-button>
          </div>
        </template>
      </t-table>
    </div>

    <!-- 注销用户表格 -->
    <div v-show="activeTab === 'cancelled'" class="table-card">
      <t-table
        :data="cancelledTableData"
        :columns="cancelledColumns"
        :loading="loading"
        row-key="userId"
        :pagination="{
          current: cancelledPage.pageNum,
          pageSize: cancelledPage.pageSize,
          total: cancelledTotal,
          pageSizeOptions: [20, 50, 100]
        }"
        :empty="cancelledTableData.length === 0 ? '暂无用户' : ''"
        @page-change="handlePageChange"
      >
        <template #avatar="{ row }">
          <t-avatar v-if="row.avatar" :image="row.avatar" size="32px" />
          <t-avatar v-else size="32px">
            <template #icon><UserFilledIcon /></template>
          </t-avatar>
        </template>

        <template #userName="{ row }">
          <a class="user-name-link" @click="handleDetail(row.userId)">{{ row.userName }}</a>
        </template>

        <template #phone="{ row }">
          {{ row.phone }}
        </template>

        <template #wechatNickname="{ row }">
          {{ row.wechatNickname || '—' }}
        </template>

        <template #wechatGender="{ row }">
          <span v-if="genderMap[row.wechatGender]?.label !== '—'" :class="`gender-${row.wechatGender}`">
            {{ genderMap[row.wechatGender]?.icon }} {{ genderMap[row.wechatGender]?.label }}
          </span>
          <span v-else class="gender-unknown">—</span>
        </template>

        <template #status="{ row }">
          <t-tag v-if="statusMap[row.status]" :theme="statusMap[row.status].theme" variant="light" size="small">
            {{ statusMap[row.status].label }}
          </t-tag>
          <span v-else>{{ row.status }}</span>
        </template>
      </t-table>
    </div>

    <!-- 用户详情弹窗 -->
    <t-dialog v-model:visible="detailVisible" header="用户详情" width="520px" :confirm-btn="null">
      <template #footer>
        <t-button theme="default" @click="detailVisible = false">关闭</t-button>
      </template>
      <div v-if="userDetail" class="detail-grid">
        <div class="detail-item detail-item--avatar">
          <t-avatar v-if="userDetail.avatar" :image="userDetail.avatar" size="64px" />
          <t-avatar v-else size="64px">
            <template #icon><UserFilledIcon /></template>
          </t-avatar>
        </div>
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
          <span class="detail-label">微信昵称</span>
          <span class="detail-value">{{ userDetail.wechatNickname || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">微信性别</span>
          <span v-if="genderMap[userDetail.wechatGender]?.label !== '—'" :class="`gender-${userDetail.wechatGender}`">
            {{ genderMap[userDetail.wechatGender]?.icon }} {{ genderMap[userDetail.wechatGender]?.label }}
          </span>
          <span v-else class="gender-unknown">—</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">手机号</span>
          <a class="phone-link" @click="togglePhone">
            {{ phoneRevealed ? userDetail.phoneReal : userDetail.phone }}
          </a>
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
        <div class="detail-item">
          <span class="detail-label">最近活跃</span>
          <span class="detail-value">{{ userDetail.lastActiveTime }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态</span>
          <t-tag v-if="statusMap[userDetail.status]" :theme="statusMap[userDetail.status].theme" variant="light" size="small">
            {{ statusMap[userDetail.status].label }}
          </t-tag>
          <span v-else class="detail-value">{{ userDetail.status }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">角色</span>
          <span class="detail-value">{{ userDetail.role }}</span>
        </div>
      </div>
    </t-dialog>

    <!-- 确认弹窗 -->
    <t-dialog v-model:visible="confirmVisible" :header="confirmType === 'cancel' ? '确认注销' : '确认拉黑'" width="400px">
      <div class="confirm-body">
        <p v-if="confirmType === 'cancel'">
          注销后该用户将无法再登录，是否确认注销用户 <strong>{{ confirmUserName }}</strong
          >（ID: {{ confirmUserId }}）？
        </p>
        <p v-else>
          拉黑后该用户将无法再使用产品，是否确认拉黑用户 <strong>{{ confirmUserName }}</strong
          >（ID: {{ confirmUserId }}）？
        </p>
      </div>
      <template #footer>
        <t-button theme="default" variant="outline" @click="confirmVisible = false">取消</t-button>
        <t-button theme="danger" @click="handleConfirm">确认</t-button>
      </template>
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-list-page {
  padding: 24px;

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

  .tabs-container {
    margin-bottom: 16px;
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
      flex-wrap: wrap;

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

  .table-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    border: 1px solid var(--td-component-stroke);
    overflow: hidden;
  }

  .user-name-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .phone-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;
    border-bottom: 1px dashed var(--td-brand-color);

    &:hover {
      color: var(--td-brand-color-8);
      border-bottom-color: var(--td-brand-color-8);
    }
  }

  .channel-text {
    display: inline-block;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-group {
    display: flex;
    gap: 4px;
  }

  .gender-male {
    color: var(--td-brand-color);
  }

  .gender-female {
    color: var(--td-error-color);
  }

  .gender-unknown {
    color: var(--td-text-color-disabled);
  }

  /* 用户详情弹窗 */
  .detail-grid {
    .detail-item {
      display: flex;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--td-component-stroke);

      &.detail-item--avatar {
        justify-content: center;
        padding: 16px 0;
        border-bottom: none;
      }

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        width: 80px;
        flex-shrink: 0;
        font-size: 14px;
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

  /* 确认弹窗 */
  .confirm-body {
    padding: 8px 0;
    font-size: 14px;
    color: var(--td-text-color-primary);

    p {
      margin: 0;
      line-height: 1.6;
    }

    strong {
      color: var(--td-brand-color);
    }
  }
}
</style>
