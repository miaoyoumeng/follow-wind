<script setup lang="ts" name="MemberProfile">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import { getMemberDetailApi, getMemberRemarkListApi, saveMemberRemarkApi, getMemberOrderListApi, getMemberLoginListApi } from '@/api/modules/user.ts';
import type { MemberList, MemberDetail } from '@/api/modules/user.ts';

const route = useRoute();
const router = useRouter();

const memberId = computed(() => Number(route.query.memberId));

/* ===== 会员基本信息 ===== */
const memberInfo = ref<MemberList.MemberDetail | null>(null);
const loading = ref(false);
const phoneVisible = ref(false);

const memberStatusMap: Record<string, { label: string; theme: 'success' | 'default' }> = {
  active: { label: '有效', theme: 'success' },
  expired: { label: '过期', theme: 'default' }
};

/* ===== 备注列表 ===== */
const remarkList = ref<MemberDetail.RemarkItem[]>([]);
const remarkTotal = ref(0);

/* ===== 编辑备注弹窗 ===== */
const remarkModalVisible = ref(false);
const remarkForm = ref('');
const remarkCharCount = ref(0);
const currentRemark = ref('');

/* ===== 全部备注弹窗 ===== */
const allRemarksModalVisible = ref(false);
const allRemarksList = ref<MemberDetail.RemarkItem[]>([]);
const allRemarksTotal = ref(0);
const allRemarksPage = ref({ pageNum: 1, pageSize: 20 });

/* ===== 订单记录 ===== */
const activeTab = ref('order');
const orderTableData = ref<MemberDetail.OrderItem[]>([]);
const orderTotal = ref(0);
const orderLoading = ref(false);
const orderPage = ref({ pageNum: 1, pageSize: 20 });
const orderPayStatus = ref('all');

const payStatusMap: Record<string, { label: string; theme: 'success' | 'warning' | 'default' }> = {
  paid: { label: '已支付', theme: 'success' },
  unpaid: { label: '未支付', theme: 'warning' },
  refunded: { label: '已退款', theme: 'default' }
};

const payStatusOptions = [
  { label: '全部', value: 'all' },
  { label: '已支付', value: 'paid' },
  { label: '未支付', value: 'unpaid' },
  { label: '已退款', value: 'refunded' }
];

const orderColumns: PrimaryTableCol[] = [
  { colKey: 'orderId', title: '订单号', width: 180 },
  { colKey: 'orderTime', title: '下单时间', width: 180 },
  { colKey: 'productName', title: '商品名称', width: 140 },
  { colKey: 'orderAmount', title: '订单金额', width: 120 },
  { colKey: 'payStatus', title: '支付状态', width: 100 },
  { colKey: 'payMethod', title: '支付方式', width: 120 }
];

/* ===== 登录记录 ===== */
const loginTableData = ref<MemberDetail.LoginItem[]>([]);
const loginTotal = ref(0);
const loginLoading = ref(false);
const loginPage = ref({ pageNum: 1, pageSize: 20 });

const loginStatusMap: Record<string, { label: string; theme: 'success' | 'danger' }> = {
  success: { label: '成功', theme: 'success' },
  fail: { label: '失败', theme: 'danger' }
};

const loginColumns: PrimaryTableCol[] = [
  { colKey: 'loginTime', title: '登录时间', width: 180 },
  { colKey: 'device', title: '登录设备', width: 160 },
  { colKey: 'ip', title: '登录 IP', width: 140 },
  { colKey: 'loginMethod', title: '登录方式', width: 120 },
  { colKey: 'loginStatus', title: '登录状态', width: 100 }
];

/* ===== 数据加载 ===== */
const loadMemberInfo = async () => {
  loading.value = true;
  try {
    const { data } = await getMemberDetailApi(memberId.value);
    if (data) {
      memberInfo.value = data;
      currentRemark.value = (data as any).remark || '';
    }
  } finally {
    loading.value = false;
  }
};

const loadRemarkList = async () => {
  const { data } = await getMemberRemarkListApi({ memberId: memberId.value, pageNum: 1, pageSize: 5 });
  if (data) {
    remarkList.value = data.list;
    remarkTotal.value = data.total;
  }
};

const loadAllRemarks = async () => {
  const { data } = await getMemberRemarkListApi({
    memberId: memberId.value,
    pageNum: allRemarksPage.value.pageNum,
    pageSize: allRemarksPage.value.pageSize
  });
  if (data) {
    allRemarksList.value = data.list;
    allRemarksTotal.value = data.total;
  }
};

const loadOrderList = async () => {
  orderLoading.value = true;
  try {
    const params: MemberDetail.OrderListParams = {
      memberId: memberId.value,
      payStatus: orderPayStatus.value !== 'all' ? orderPayStatus.value : undefined,
      pageNum: orderPage.value.pageNum,
      pageSize: orderPage.value.pageSize
    };
    const { data } = await getMemberOrderListApi(params);
    if (data) {
      orderTableData.value = data.list;
      orderTotal.value = data.total;
    }
  } finally {
    orderLoading.value = false;
  }
};

const loadLoginList = async () => {
  loginLoading.value = true;
  try {
    const { data } = await getMemberLoginListApi({
      memberId: memberId.value,
      pageNum: loginPage.value.pageNum,
      pageSize: loginPage.value.pageSize
    });
    if (data) {
      loginTableData.value = data.list;
      loginTotal.value = data.total;
    }
  } finally {
    loginLoading.value = false;
  }
};

/* ===== 交互处理 ===== */
const handleBack = () => {
  router.push('/member/list');
};

const togglePhone = () => {
  phoneVisible.value = !phoneVisible.value;
};

const handleTabChange = (tab: string) => {
  activeTab.value = tab;
  if (tab === 'order') {
    loadOrderList();
  } else {
    loadLoginList();
  }
};

const handleOrderPageChange = (pageInfo: PageInfo) => {
  orderPage.value.pageNum = pageInfo.current;
  orderPage.value.pageSize = pageInfo.pageSize;
  loadOrderList();
};

const handleLoginPageChange = (pageInfo: PageInfo) => {
  loginPage.value.pageNum = pageInfo.current;
  loginPage.value.pageSize = pageInfo.pageSize;
  loadLoginList();
};

const handlePayStatusChange = () => {
  orderPage.value.pageNum = 1;
  loadOrderList();
};

/* ===== 备注相关 ===== */
const openRemarkModal = () => {
  remarkForm.value = currentRemark.value;
  remarkCharCount.value = remarkForm.value.length;
  remarkModalVisible.value = true;
};

const handleRemarkInputChange = (value: string) => {
  remarkCharCount.value = value.length;
};

const saveRemark = async () => {
  if (remarkCharCount.value > 500) {
    MessagePlugin.warning('备注内容不能超过 500 字');
    return;
  }
  try {
    await saveMemberRemarkApi({ memberId: memberId.value, content: remarkForm.value });
    MessagePlugin.success('备注已更新');
    remarkModalVisible.value = false;
    currentRemark.value = remarkForm.value;
    loadRemarkList();
  } catch {
    MessagePlugin.error('备注更新失败');
  }
};

const openAllRemarks = () => {
  allRemarksPage.value = { pageNum: 1, pageSize: 20 };
  loadAllRemarks();
  allRemarksModalVisible.value = true;
};

const handleAllRemarksPageChange = (pageInfo: PageInfo) => {
  allRemarksPage.value.pageNum = pageInfo.current;
  allRemarksPage.value.pageSize = pageInfo.pageSize;
  loadAllRemarks();
};

/* ===== 初始化 ===== */
onMounted(() => {
  if (!memberId.value) {
    MessagePlugin.error('缺少会员 ID 参数');
    router.push('/member/list');
    return;
  }
  loadMemberInfo();
  loadRemarkList();
  loadOrderList();
});
</script>

<template>
  <div class="member-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <a class="back-link" @click="handleBack">← 返回会员列表</a>
        <h2 class="page-title">会员详情</h2>
      </div>
      <div class="page-header-actions">
        <t-button theme="default" variant="outline" @click="openRemarkModal">编辑备注</t-button>
      </div>
    </div>

    <!-- 会员基本信息 -->
    <t-card :bordered="false" class="info-card" v-loading="loading">
      <template #header>
        <span class="card-title">会员基本信息</span>
      </template>
      <div v-if="memberInfo" class="basic-info">
        <div class="avatar-section">
          <t-avatar v-if="memberInfo.avatar" :image="memberInfo.avatar" size="64px" />
          <t-avatar v-else size="64px">
            <template #icon><t-user-icon /></template>
          </t-avatar>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">用户 ID</span>
            <span class="info-value">{{ memberInfo.memberId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">用户名称</span>
            <span class="info-value">{{ memberInfo.userName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">昵称</span>
            <span class="info-value">{{ memberInfo.nickname }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">微信昵称</span>
            <span class="info-value">{{ memberInfo.wechatNickname || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">
              <span class="phone-masked">{{ phoneVisible ? memberInfo.phone : memberInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}</span>
              <a class="toggle-link" @click="togglePhone">{{ phoneVisible ? '隐藏明文' : '查看明文' }}</a>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">一级渠道</span>
            <span class="info-value">{{ memberInfo.channel1 }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">二级渠道</span>
            <span class="info-value">{{ (memberInfo as any).channel2 || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ memberInfo.registerTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">会员状态</span>
            <span class="info-value">
              <t-tag
                v-if="memberStatusMap[memberInfo.memberStatus]"
                :theme="memberStatusMap[memberInfo.memberStatus].theme"
                variant="light"
                size="small"
              >
                {{ memberStatusMap[memberInfo.memberStatus].label }}
              </t-tag>
              <span v-else>{{ memberInfo.memberStatus }}</span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">开通时间</span>
            <span class="info-value">{{ memberInfo.memberStartDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">截止日期</span>
            <span class="info-value">{{ memberInfo.memberExpireDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">累计订单金额</span>
            <span class="amount-value">¥{{ memberInfo.totalConsume.toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">确收金额</span>
            <span class="amount-value">¥{{ (memberInfo as any).confirmedAmount ?? memberInfo.totalConsume.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 运营备注 -->
    <t-card :bordered="false" class="remark-card">
      <template #header>
        <span class="card-title">运营备注</span>
      </template>
      <template #actions>
        <t-button variant="text" theme="primary" @click="openAllRemarks">全部</t-button>
      </template>
      <div v-if="remarkList.length > 0" class="remark-list">
        <div v-for="item in remarkList" :key="item.id" class="remark-item">
          <div class="remark-meta">
            <span class="remark-time">{{ item.operateTime }}</span>
            <span class="remark-operator">{{ item.operatorName }}</span>
          </div>
          <span class="remark-content">{{ item.content }}</span>
        </div>
      </div>
      <div v-else class="empty-text">暂无备注记录</div>
    </t-card>

    <!-- 记录 Tab -->
    <t-card :bordered="false" class="record-card">
      <t-tabs v-model="activeTab" @change="handleTabChange">
        <t-tab-panel value="order" label="订单记录">
          <template #label>
            <span :class="{ 'tab-label': true, 'tab-active': activeTab === 'order' }">订单记录</span>
          </template>
          <div class="filter-bar">
            <div class="filter-item">
              <label class="filter-label">支付状态</label>
              <t-select v-model="orderPayStatus" @change="handlePayStatusChange" style="width: 140px">
                <t-option v-for="opt in payStatusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
              </t-select>
            </div>
          </div>
          <t-table
            :data="orderTableData"
            :columns="orderColumns"
            :loading="orderLoading"
            row-key="orderId"
            :pagination="{
              current: orderPage.pageNum,
              pageSize: orderPage.pageSize,
              total: orderTotal,
              pageSizeOptions: [20, 50, 100]
            }"
            :empty="orderTableData.length === 0 ? '暂无订单记录' : ''"
            @page-change="handleOrderPageChange"
          >
            <template #orderAmount="{ row }"> ¥{{ row.orderAmount.toFixed(2) }} </template>
            <template #payStatus="{ row }">
              <t-tag v-if="payStatusMap[row.payStatus]" :theme="payStatusMap[row.payStatus].theme" variant="light" size="small">
                {{ payStatusMap[row.payStatus].label }}
              </t-tag>
              <span v-else>{{ row.payStatus }}</span>
            </template>
          </t-table>
        </t-tab-panel>
        <t-tab-panel value="login" label="登录记录">
          <template #label>
            <span :class="{ 'tab-label': true, 'tab-active': activeTab === 'login' }">登录记录</span>
          </template>
          <t-table
            :data="loginTableData"
            :columns="loginColumns"
            :loading="loginLoading"
            row-key="id"
            :pagination="{
              current: loginPage.pageNum,
              pageSize: loginPage.pageSize,
              total: loginTotal,
              pageSizeOptions: [20, 50, 100]
            }"
            :empty="loginTableData.length === 0 ? '暂无登录记录' : ''"
            @page-change="handleLoginPageChange"
          >
            <template #loginStatus="{ row }">
              <t-tag v-if="loginStatusMap[row.loginStatus]" :theme="loginStatusMap[row.loginStatus].theme" variant="light" size="small">
                {{ loginStatusMap[row.loginStatus].label }}
              </t-tag>
              <span v-else>{{ row.loginStatus }}</span>
            </template>
          </t-table>
        </t-tab-panel>
      </t-tabs>
    </t-card>

    <!-- 编辑备注弹窗 -->
    <t-dialog v-model:visible="remarkModalVisible" header="编辑备注" width="500px">
      <div class="remark-modal-body">
        <div class="modal-section">
          <label class="modal-label">当前备注</label>
          <div class="current-remark">{{ currentRemark || '暂无备注' }}</div>
        </div>
        <div class="modal-section">
          <label class="modal-label">新增备注</label>
          <t-textarea
            v-model="remarkForm"
            placeholder="请输入运营备注，最多 500 字..."
            :maxlength="500"
            :autosize="{ minRows: 4, maxRows: 8 }"
            @change="handleRemarkInputChange"
          />
          <div class="char-count">{{ remarkCharCount }}/500</div>
        </div>
      </div>
      <template #footer>
        <t-button theme="default" variant="outline" @click="remarkModalVisible = false">取消</t-button>
        <t-button theme="primary" @click="saveRemark">保存</t-button>
      </template>
    </t-dialog>

    <!-- 全部备注弹窗 -->
    <t-dialog v-model:visible="allRemarksModalVisible" header="全部备注记录" width="640px" :footer="false">
      <div class="all-remarks-body">
        <t-table
          :data="allRemarksList"
          row-key="id"
          :columns="[
            { colKey: 'operateTime', title: '操作时间', width: 160 },
            { colKey: 'operatorName', title: '操作人', width: 100 },
            { colKey: 'content', title: '备注内容' }
          ]"
          :pagination="{
            current: allRemarksPage.pageNum,
            pageSize: allRemarksPage.pageSize,
            total: allRemarksTotal
          }"
          :empty="allRemarksList.length === 0 ? '暂无备注记录' : ''"
          @page-change="handleAllRemarksPageChange"
        />
      </div>
    </t-dialog>
  </div>
</template>

<style scoped lang="scss">
.member-detail-page {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .back-link {
      color: var(--td-brand-color);
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;

      &:hover {
        text-decoration: underline;
      }
    }

    .page-title {
      margin-top: 8px;
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .info-card,
  .remark-card,
  .record-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  /* 基本信息 */
  .basic-info {
    display: flex;
    gap: 24px;

    .avatar-section {
      flex-shrink: 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px 24px;
      flex: 1;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .info-label {
          font-size: 12px;
          color: var(--td-text-color-placeholder);
        }

        .info-value {
          font-size: 14px;
          color: var(--td-text-color-primary);
        }

        .phone-masked {
          font-size: 14px;
          color: var(--td-text-color-primary);
        }

        .toggle-link {
          color: var(--td-brand-color);
          font-size: 12px;
          cursor: pointer;
          margin-left: 8px;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .amount-value {
        font-size: 14px;
        color: var(--td-text-color-primary);
        font-weight: 500;
      }
    }
  }

  /* 备注区域 */
  .remark-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .remark-item {
      display: flex;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--td-component-stroke);

      &:last-child {
        border-bottom: none;
      }

      .remark-meta {
        flex-shrink: 0;
        width: 220px;
        display: flex;
        gap: 8px;
        font-size: 12px;

        .remark-time {
          color: var(--td-text-color-placeholder);
        }

        .remark-operator {
          color: var(--td-text-color-secondary);
          font-weight: 500;
        }
      }

      .remark-content {
        flex: 1;
        font-size: 13px;
        color: var(--td-text-color-primary);
      }
    }
  }

  .empty-text {
    text-align: center;
    padding: 40px 20px;
    color: var(--td-text-color-placeholder);
    font-size: 14px;
  }

  /* 筛选栏 */
  .filter-bar {
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-end;
    border-bottom: 1px solid var(--td-component-stroke);

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .filter-label {
        font-size: 12px;
        color: var(--td-text-color-placeholder);
      }
    }
  }

  /* Tab 标签 */
  .tab-label {
    font-size: 14px;
    color: var(--td-text-color-secondary);

    &.tab-active {
      color: var(--td-brand-color);
      font-weight: 500;
    }
  }

  /* 备注弹窗 */
  .remark-modal-body {
    padding: 8px 0;

    .modal-section {
      margin-bottom: 16px;

      .modal-label {
        display: block;
        font-size: 14px;
        color: var(--td-text-color-secondary);
        margin-bottom: 6px;
      }

      .current-remark {
        background: var(--td-bg-color-secondary);
        border-radius: 4px;
        padding: 12px;
        font-size: 13px;
        color: var(--td-text-color-secondary);
      }

      .char-count {
        text-align: right;
        font-size: 12px;
        color: var(--td-text-color-placeholder);
        margin-top: 4px;
      }
    }
  }

  /* 全部备注弹窗 */
  .all-remarks-body {
    padding: 0;
  }
}
</style>
