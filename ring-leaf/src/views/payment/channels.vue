<script setup lang="ts" name="PaymentChannelList">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Dialog, Form, FormItem, Input, Button, Textarea, Radio, RadioGroup, Upload } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo, UploadFile } from 'tdesign-vue-next';

import { getPaymentChannelListApi, createPaymentChannelApi, updatePaymentChannelApi } from '@/api/modules/payment-channel.ts';
import type { PaymentChannel } from '@/api/modules/payment-channel.ts';

/* ===== 列表数据 ===== */
const channelList = ref<PaymentChannel.ChannelItem[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const filterType = ref<'wechat' | 'alipay' | ''>('');

/* ===== 弹窗 ===== */
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const channelForm = ref({
  id: 0,
  name: '',
  type: '' as 'wechat' | 'alipay' | '',
  merchantId: '',
  merchantKey: '',
  companyName: '',
  remark: '',
  certificateFile: null as UploadFile | null
});
const formError = ref('');

/* ===== 渠道类型选项 ===== */
const channelTypeOptions = [
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' }
];

/* ===== 加载列表 ===== */
const loadList = async () => {
  const { data } = await getPaymentChannelListApi({
    type: filterType.value || undefined,
    pageNum: pageNum.value,
    pageSize: pageSize.value
  });
  if (data) {
    channelList.value = data.list;
    total.value = data.total;
  }
};

/* ===== 筛选 ===== */
const handleSearch = () => {
  pageNum.value = 1;
  loadList();
};

/* ===== 新建 ===== */
const handleCreate = () => {
  dialogMode.value = 'create';
  channelForm.value = {
    id: 0,
    name: '',
    type: '',
    merchantId: '',
    merchantKey: '',
    companyName: '',
    remark: '',
    certificateFile: null
  };
  formError.value = '';
  dialogVisible.value = true;
};

/* ===== 编辑 ===== */
const handleEdit = (row: PaymentChannel.ChannelItem) => {
  dialogMode.value = 'edit';
  channelForm.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    merchantId: row.merchantId,
    merchantKey: '',
    companyName: row.companyName,
    remark: row.remark,
    certificateFile: null
  };
  formError.value = '';
  dialogVisible.value = true;
};

/* ===== 表单校验 ===== */
const validateForm = (): { valid: boolean; error: string } => {
  if (!channelForm.value.name.trim()) {
    return { valid: false, error: '渠道名称不能为空' };
  }
  if (channelForm.value.name.length > 50) {
    return { valid: false, error: '渠道名称不能超过 50 个字符' };
  }
  if (dialogMode.value === 'create' && !channelForm.value.type) {
    return { valid: false, error: '请选择渠道类型' };
  }
  if (!channelForm.value.merchantId.trim()) {
    return { valid: false, error: '商户号/AppID 不能为空' };
  }
  if (dialogMode.value === 'create' && !channelForm.value.merchantKey.trim()) {
    return { valid: false, error: '商户密钥不能为空' };
  }
  if (!channelForm.value.companyName.trim()) {
    return { valid: false, error: '所属公司不能为空' };
  }
  if (channelForm.value.type === 'wechat' && !channelForm.value.certificateFile) {
    return { valid: false, error: '微信支付需上传证书文件' };
  }
  if (channelForm.value.remark.length > 200) {
    return { valid: false, error: '备注不能超过 200 个字符' };
  }
  return { valid: true, error: '' };
};

/* ===== 保存 ===== */
const confirmSave = async () => {
  const result = validateForm();
  if (!result.valid) {
    formError.value = result.error;
    return;
  }
  try {
    if (dialogMode.value === 'create') {
      await createPaymentChannelApi({
        name: channelForm.value.name.trim(),
        type: channelForm.value.type as 'wechat' | 'alipay',
        merchantId: channelForm.value.merchantId.trim(),
        merchantKey: channelForm.value.merchantKey.trim(),
        companyName: channelForm.value.companyName.trim(),
        remark: channelForm.value.remark.trim()
      });
      MessagePlugin.success('支付渠道已创建');
    } else {
      await updatePaymentChannelApi({
        id: channelForm.value.id,
        name: channelForm.value.name.trim(),
        merchantId: channelForm.value.merchantId.trim(),
        merchantKey: channelForm.value.merchantKey.trim() || undefined,
        companyName: channelForm.value.companyName.trim(),
        remark: channelForm.value.remark.trim()
      });
      MessagePlugin.success('支付渠道已更新');
    }
    dialogVisible.value = false;
    loadList();
  } catch (e: any) {
    formError.value = e.message;
  }
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  pageNum.value = pageInfo.current;
  pageSize.value = pageInfo.pageSize;
  loadList();
};

/* ===== 证书上传 ===== */
const handleCertificateChange = (files: UploadFile[]) => {
  if (files.length > 0) {
    channelForm.value.certificateFile = files[files.length - 1];
  }
};

/* ===== 脱敏 ===== */
const maskMerchantId = (id: string) => {
  if (id.length <= 4) return '***' + id.slice(-1);
  return id.slice(0, 3) + '****' + id.slice(-4);
};

/* ===== 表格列 ===== */
const columns: PrimaryTableCol<PaymentChannel.ChannelItem>[] = [
  { colKey: 'id', title: '渠道ID', width: 80 },
  { colKey: 'name', title: '渠道名称', width: 180 },
  { colKey: 'type', title: '渠道类型', width: 100 },
  { colKey: 'merchantId', title: '商户号', width: 140 },
  { colKey: 'companyName', title: '所属公司' },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'row-operation', title: '操作', width: 80, fixed: 'right' }
];

/* ===== 初始化 ===== */
onMounted(() => {
  loadList();
});
</script>

<template>
  <div class="payment-channel-page">
    <div class="page-header">
      <h2 class="page-title">支付渠道列表</h2>
      <Button theme="primary" @click="handleCreate">新增渠道</Button>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="filter-group">
          <span class="filter-label">支付渠道：</span>
          <t-select v-model="filterType" placeholder="全部" clearable style="width: 160px" @change="handleSearch">
            <t-option value="wechat" label="微信支付" />
            <t-option value="alipay" label="支付宝" />
          </t-select>
        </div>
      </div>

      <t-table
        :data="channelList"
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
        empty="暂无支付渠道"
      >
        <template #type="{ row }">
          <t-tag v-if="row.type === 'wechat'" theme="success" variant="light" size="small">微信支付</t-tag>
          <t-tag v-else theme="primary" variant="light" size="small">支付宝</t-tag>
        </template>

        <template #merchantId="{ row }">
          {{ maskMerchantId(row.merchantId) }}
        </template>

        <template #status="{ row }">
          <t-tag v-if="row.status === 'enabled'" theme="success" variant="light" size="small">启用</t-tag>
          <t-tag v-else theme="default" variant="light" size="small">停用</t-tag>
        </template>

        <template #row-operation="{ row }">
          <a class="action-link" @click="handleEdit(row)">编辑</a>
        </template>
      </t-table>
    </div>

    <!-- 新建/编辑弹窗 -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="dialogMode === 'create' ? '新建支付渠道' : '编辑支付渠道'"
      width="560px"
      attach="body"
      @confirm="confirmSave"
    >
      <Form layout="vertical" class="channel-form">
        <FormItem label="渠道名称" required>
          <Input v-model="channelForm.name" placeholder="请输入渠道名称，如：微信支付-北京公司" :maxlength="50" :show-limit-number="true" />
        </FormItem>

        <FormItem label="渠道类型" required>
          <RadioGroup v-model="channelForm.type" :disabled="dialogMode === 'edit'">
            <Radio v-for="opt in channelTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</Radio>
          </RadioGroup>
        </FormItem>

        <FormItem label="商户号/AppID" required>
          <Input v-model="channelForm.merchantId" placeholder="请输入商户号或AppID" />
        </FormItem>

        <FormItem label="商户密钥" :required="dialogMode === 'create'">
          <Input
            v-model="channelForm.merchantKey"
            :type="dialogMode === 'create' ? 'password' : 'text'"
            :placeholder="dialogMode === 'create' ? '请输入商户密钥' : '留空表示不修改'"
          />
        </FormItem>

        <FormItem label="所属公司" required>
          <Input v-model="channelForm.companyName" placeholder="请输入所属公司名称" />
        </FormItem>

        <FormItem v-if="channelForm.type === 'wechat'" label="证书文件" required>
          <Upload :files="channelForm.certificateFile ? [channelForm.certificateFile] : []" accept=".p12" :max="1" @change="handleCertificateChange">
            <template #trigger>
              <Button theme="default" variant="outline" size="small">选择文件</Button>
            </template>
          </Upload>
          <div class="form-tip">微信支付需要上传 .p12 格式证书文件</div>
        </FormItem>

        <FormItem label="备注">
          <Textarea
            v-model="channelForm.remark"
            :maxlength="200"
            :show-limit-number="true"
            placeholder="可选，200 字以内"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </FormItem>
      </Form>
      <div v-if="formError" class="form-error">{{ formError }}</div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.payment-channel-page {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

  .table-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;

    .table-toolbar {
      padding: 16px;
      border-bottom: 1px solid var(--td-component-stroke);

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .filter-label {
          font-size: 14px;
          color: var(--td-text-color-secondary);
          white-space: nowrap;
        }
      }
    }
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

    &.danger {
      color: var(--td-error-color);
    }
  }

  .channel-form {
    .form-tip {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
      margin-top: 4px;
    }

    .form-error {
      color: var(--td-error-color);
      font-size: 12px;
      margin-top: 8px;
    }
  }
}
</style>
