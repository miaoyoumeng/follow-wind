<script setup lang="ts" name="MemberList">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import { UserFilledIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import { getMemberListApi, updateMemberRemarkApi, getChannelOptionsApi } from '@/api/modules/user.ts';
import type { MemberList } from '@/api/modules/user.ts';

const router = useRouter();

/* ===== 筛选条件 ===== */
const filterForm = ref({
  channel1: '',
  userId: '',
  userName: '',
  phone: ''
});

const channelOptionsList = ref<{ value: string; label: string }[]>([]);

/* ===== 列表数据 ===== */
const tableData = ref<MemberList.MemberItem[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref({ pageNum: 1, pageSize: 20 });

/* ===== 备注弹窗 ===== */
const remarkVisible = ref(false);
const remarkForm = ref<MemberList.RemarkParams>({
  memberId: 0,
  remark: ''
});
const remarkMemberName = ref('');
const charCount = ref(0);

/* ===== 会员状态映射 ===== */
const memberStatusMap: Record<string, { label: string; theme: 'success' | 'default' }> = {
  active: { label: '有效', theme: 'success' },
  expired: { label: '过期', theme: 'default' }
};

/* ===== 表格列定义 ===== */
const columns: PrimaryTableCol[] = [
  { colKey: 'avatar', title: '头像', width: 80 },
  { colKey: 'memberId', title: '用户ID', width: 100 },
  { colKey: 'userName', title: '用户名称', width: 140 },
  { colKey: 'nickname', title: '昵称', width: 120 },
  { colKey: 'wechatNickname', title: '微信昵称', width: 120 },
  { colKey: 'phone', title: '手机号', width: 140 },
  { colKey: 'channel1', title: '一级渠道', width: 100 },
  { colKey: 'registerTime', title: '注册时间', width: 180 },
  { colKey: 'memberStatus', title: '会员状态', width: 100 },
  { colKey: 'memberExpireDate', title: '会员截止日期', width: 140 },
  { colKey: 'totalConsume', title: '累计消费', width: 100 },
  { colKey: 'op', title: '操作', width: 120, fixed: 'right' }
];

/* ===== 数据加载 ===== */
const loadChannelOptions = async () => {
  const { data } = await getChannelOptionsApi();
  if (data) {
    channelOptionsList.value = data;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const params: MemberList.ListParams = {
      channel1: filterForm.value.channel1 || undefined,
      userId: filterForm.value.userId || undefined,
      userName: filterForm.value.userName || undefined,
      phone: filterForm.value.phone || undefined,
      pageNum: page.value.pageNum,
      pageSize: page.value.pageSize
    };
    const { data } = await getMemberListApi(params);
    if (data) {
      tableData.value = data.list;
      total.value = data.total;
    }
  } finally {
    loading.value = false;
  }
};

/* ===== 交互处理 ===== */
const handleSearch = () => {
  page.value.pageNum = 1;
  loadData();
};

const handleReset = () => {
  filterForm.value = { channel1: '', userId: '', userName: '', phone: '' };
  page.value.pageNum = 1;
  loadData();
};

const handlePageChange = (pageInfo: PageInfo) => {
  page.value.pageNum = pageInfo.current;
  page.value.pageSize = pageInfo.pageSize;
  loadData();
};

const handleDetail = (memberId: number) => {
  router.push({ path: '/member/profile', query: { memberId: String(memberId) } });
};

const handleRemark = (row: MemberList.MemberItem) => {
  remarkForm.value = { memberId: row.memberId, remark: row.remark || '' };
  remarkMemberName.value = row.nickname;
  charCount.value = (row.remark || '').length;
  remarkVisible.value = true;
};

const handleRemarkInput = (value: string) => {
  charCount.value = value.length;
};

const handleSaveRemark = async () => {
  if (charCount.value > 500) {
    MessagePlugin.warning('备注内容不能超过 500 字');
    return;
  }
  try {
    await updateMemberRemarkApi(remarkForm.value);
    MessagePlugin.success('备注已更新');
    remarkVisible.value = false;
    loadData();
  } catch {
    MessagePlugin.error('备注更新失败');
  }
};

/* ===== 初始化 ===== */
onMounted(() => {
  loadChannelOptions();
  loadData();
});
</script>

<template>
  <div class="member-list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">会员列表</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">一级渠道</label>
          <t-select v-model="filterForm.channel1" placeholder="请选择一级渠道" clearable style="width: 180px">
            <t-option value="" label="全部" />
            <t-option v-for="opt in channelOptionsList" :key="opt.value" :value="opt.value" :label="opt.label" />
          </t-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">用户ID</label>
          <t-input v-model="filterForm.userId" placeholder="请输入用户ID" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">用户名称</label>
          <t-input v-model="filterForm.userName" placeholder="请输入用户名称" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label class="filter-label">手机号</label>
          <t-input v-model="filterForm.phone" placeholder="请输入手机号" clearable style="width: 160px" @enter="handleSearch" />
        </div>
        <div class="btn-group">
          <t-button theme="primary" @click="handleSearch">搜索</t-button>
          <t-button theme="default" variant="outline" @click="handleReset">重置</t-button>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <t-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        row-key="memberId"
        :pagination="{
          current: page.pageNum,
          pageSize: page.pageSize,
          total: total,
          pageSizeOptions: [20, 50, 100]
        }"
        :empty="tableData.length === 0 ? '暂无会员用户' : ''"
        @page-change="handlePageChange"
      >
        <template #avatar="{ row }">
          <t-avatar v-if="row.avatar" :image="row.avatar" size="32px" />
          <t-avatar v-else size="32px">
            <template #icon><user-filled-icon /></template>
          </t-avatar>
        </template>

        <template #wechatNickname="{ row }">
          {{ row.wechatNickname || '—' }}
        </template>

        <template #memberStatus="{ row }">
          <t-tag v-if="memberStatusMap[row.memberStatus]" :theme="memberStatusMap[row.memberStatus].theme" variant="light" size="small">
            {{ memberStatusMap[row.memberStatus].label }}
          </t-tag>
          <span v-else>{{ row.memberStatus }}</span>
        </template>

        <template #totalConsume="{ row }"> &yen;{{ row.totalConsume.toFixed(2) }} </template>

        <template #op="{ row }">
          <div class="action-group">
            <t-button variant="text" theme="primary" size="small" @click="handleDetail(row.memberId)"> 详情 </t-button>
            <t-button variant="text" theme="warning" size="small" @click="handleRemark(row)"> 备注 </t-button>
          </div>
        </template>
      </t-table>
    </div>

    <!-- 备注弹窗 -->
    <t-dialog v-model:visible="remarkVisible" header="添加备注" width="500px">
      <div class="remark-modal-body">
        <div class="remark-member-info">
          <span class="info-label">用户 ID</span>
          <span class="info-value">{{ remarkForm.memberId }}</span>
          <span class="info-label">昵称</span>
          <span class="info-value">{{ remarkMemberName }}</span>
        </div>
        <div class="remark-input-wrap">
          <label class="input-label">备注内容</label>
          <t-textarea
            v-model="remarkForm.remark"
            placeholder="请输入运营备注，最多 500 字..."
            :maxlength="500"
            :autosize="{ minRows: 4, maxRows: 8 }"
            @change="handleRemarkInput"
          />
          <div class="char-count">{{ charCount }}/500</div>
        </div>
      </div>
      <template #footer>
        <t-button theme="default" variant="outline" @click="remarkVisible = false">取消</t-button>
        <t-button theme="primary" @click="handleSaveRemark">保存</t-button>
      </template>
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.member-list-page {
  padding: 24px;

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
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

  .action-group {
    display: flex;
    gap: 4px;
  }

  /* 备注弹窗 */
  .remark-modal-body {
    padding: 8px 0;

    .remark-member-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--td-component-stroke);

      .info-label {
        font-size: 13px;
        color: var(--td-text-color-placeholder);
      }

      .info-value {
        font-size: 14px;
        color: var(--td-text-color-primary);
      }
    }

    .remark-input-wrap {
      .input-label {
        display: block;
        font-size: 14px;
        color: var(--td-text-color-secondary);
        margin-bottom: 8px;
      }

      .char-count {
        text-align: right;
        font-size: 12px;
        color: var(--td-text-color-placeholder);
        margin-top: 4px;
      }
    }
  }
}
</style>
