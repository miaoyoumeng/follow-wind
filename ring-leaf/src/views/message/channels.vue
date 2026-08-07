<script setup lang="ts" name="MessageChannelManager">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Button, Table, Select, Option, Dialog, Form, FormItem, Input, Textarea, Popconfirm, Tag } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';

import {
  getChannelListApi,
  getChannelTypeOptionsApi,
  getPlatformOptionsApi,
  createChannelApi,
  updateChannelApi,
  toggleChannelStatusApi,
  deleteChannelApi
} from '@/api/message.ts';
import type { MessageChannel } from '@/api/modules/message.ts';

/* ===== 列表数据 ===== */
const channelList = ref<MessageChannel.ChannelItem[]>([]);
const channelTotal = ref(0);
const channelLoading = ref(false);
const pageParams = ref({ pageNum: 1, pageSize: 20 });

/* ===== 筛选条件 ===== */
const filterType = ref<MessageChannel.ChannelType | ''>('');
const filterStatus = ref<MessageChannel.Status | ''>('');

/* ===== 类型/平台选项 ===== */
const channelTypeOptions = ref<MessageChannel.ChannelTypeOption[]>([]);
const platformOptions = ref<MessageChannel.PlatformOption[]>([]);

/* ===== 新建/编辑弹窗 ===== */
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const dialogTitle = ref('');

const formData = ref<MessageChannel.CreateParams & { id?: number }>({
  name: '',
  type: 'inapp',
  platformName: '',
  appKey: '',
  appSecret: '',
  remark: ''
});
const formError = ref('');

/* ===== 表格列定义 ===== */
const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'name', title: '渠道名称', width: 160 },
  { colKey: 'typeName', title: '类型', width: 100 },
  { colKey: 'appKey', title: 'App Key', width: 140 },
  { colKey: 'platformName', title: '平台名称', width: 120 },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'templateCount', title: '关联模板数', width: 120 },
  { colKey: 'createdAt', title: '创建时间', width: 120 },
  { colKey: 'row-operation', title: '操作', width: 200, fixed: 'right' }
];

/* ===== 数据加载 ===== */
const loadData = async () => {
  channelLoading.value = true;
  try {
    const { data } = await getChannelListApi({
      type: filterType.value || undefined,
      status: filterStatus.value || undefined,
      pageNum: pageParams.value.pageNum,
      pageSize: pageParams.value.pageSize
    });
    if (data) {
      channelList.value = data.list;
      channelTotal.value = data.total;
    }
  } finally {
    channelLoading.value = false;
  }
};

const loadOptions = async () => {
  const { data: typeData } = await getChannelTypeOptionsApi();
  if (typeData) {
    channelTypeOptions.value = typeData;
  }
  const { data: platData } = await getPlatformOptionsApi();
  if (platData) {
    platformOptions.value = platData;
  }
};

/* ===== 筛选操作 ===== */
const handleSearch = () => {
  pageParams.value.pageNum = 1;
  loadData();
};

const handleReset = () => {
  filterType.value = '';
  filterStatus.value = '';
  pageParams.value.pageNum = 1;
  loadData();
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  pageParams.value.pageNum = pageInfo.current;
  pageParams.value.pageSize = pageInfo.pageSize;
  loadData();
};

/* ===== 新建 ===== */
const handleCreate = () => {
  dialogMode.value = 'create';
  dialogTitle.value = '新建消息渠道';
  formData.value = {
    name: '',
    type: 'inapp',
    platformName: '',
    appKey: '',
    appSecret: '',
    remark: ''
  };
  formError.value = '';
  dialogVisible.value = true;
};

/* ===== 编辑 ===== */
const handleEdit = (row: MessageChannel.ChannelItem) => {
  dialogMode.value = 'edit';
  dialogTitle.value = '编辑消息渠道';
  formData.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    platformName: row.platformName,
    appKey: row.appKey === '-' ? '' : row.appKey,
    appSecret: '',
    remark: row.remark
  };
  formError.value = '';
  dialogVisible.value = true;
};

/* ===== 表单校验 ===== */
const validateForm = (): { valid: boolean; error: string } => {
  const { name, type, platformName, appKey, appSecret } = formData.value;
  if (!name.trim()) {
    return { valid: false, error: '渠道名称不能为空' };
  }
  if (name.length > 50) {
    return { valid: false, error: '渠道名称不能超过 50 字符' };
  }
  if (!platformName) {
    return { valid: false, error: '请选择平台名称' };
  }
  // App Key 校验：站内信/短信/邮件可不填，其他必填
  const needsAppKey = type === 'push' || type === 'wechat';
  if (needsAppKey && !appKey?.trim()) {
    return { valid: false, error: 'App Key 不能为空' };
  }
  // AppSecret 校验：新建时必填，编辑时选填
  if (dialogMode.value === 'create' && !appSecret?.trim()) {
    return { valid: false, error: 'AppSecret 不能为空' };
  }
  if (formData.value.remark && formData.value.remark.length > 200) {
    return { valid: false, error: '备注不能超过 200 字符' };
  }
  return { valid: true, error: '' };
};

/* ===== 保存 ===== */
const handleSave = async () => {
  const result = validateForm();
  if (!result.valid) {
    formError.value = result.error;
    return;
  }
  try {
    if (dialogMode.value === 'create') {
      await createChannelApi({
        name: formData.value.name.trim(),
        type: formData.value.type,
        platformName: formData.value.platformName,
        appKey: formData.value.appKey?.trim(),
        appSecret: formData.value.appSecret,
        remark: formData.value.remark
      });
      MessagePlugin.success('消息渠道已创建');
    } else {
      await updateChannelApi({
        id: formData.value.id!,
        name: formData.value.name.trim(),
        type: formData.value.type,
        platformName: formData.value.platformName,
        appKey: formData.value.appKey?.trim(),
        appSecret: formData.value.appSecret,
        remark: formData.value.remark
      });
      MessagePlugin.success('消息渠道已更新');
    }
    dialogVisible.value = false;
    loadData();
  } catch (e: any) {
    formError.value = e.message;
  }
};

/* ===== 启用/停用 ===== */
const handleToggleStatus = async (row: MessageChannel.ChannelItem) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active';
  const actionText = newStatus === 'active' ? '启用' : '停用';
  try {
    await toggleChannelStatusApi({ id: row.id, status: newStatus });
    MessagePlugin.success(`消息渠道已${actionText}`);
    loadData();
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 删除 ===== */
const handleDelete = async (row: MessageChannel.ChannelItem) => {
  try {
    await deleteChannelApi({ id: row.id });
    MessagePlugin.success('消息渠道已删除');
    loadData();
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 渠道类型是否需要 App Key ===== */
const needsAppKey = (type: MessageChannel.ChannelType) => type === 'push' || type === 'wechat';

/* ===== 初始化 ===== */
onMounted(() => {
  loadOptions();
  loadData();
});
</script>

<template>
  <div class="message-channel-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">消息渠道管理</h2>
      <Button theme="primary" @click="handleCreate">新增渠道</Button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">渠道类型</label>
          <Select v-model="filterType" placeholder="全部" clearable style="width: 160px">
            <Option value="" label="全部" />
            <Option v-for="opt in channelTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </Select>
        </div>
        <div class="filter-item">
          <label class="filter-label">状态</label>
          <Select v-model="filterStatus" placeholder="全部" clearable style="width: 160px">
            <Option value="" label="全部" />
            <Option value="active" label="启用" />
            <Option value="inactive" label="停用" />
          </Select>
        </div>
        <div class="btn-group">
          <Button theme="primary" @click="handleSearch">搜索</Button>
          <Button theme="default" @click="handleReset">重置</Button>
        </div>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="table-card">
      <Table
        :data="channelList"
        :columns="columns"
        :loading="channelLoading"
        row-key="id"
        :hover="true"
        :stripe="false"
        :bordered="false"
        :pagination="{
          current: pageParams.pageNum,
          pageSize: pageParams.pageSize,
          total: channelTotal,
          pageSizeOptions: [20, 50, 100],
          showJumper: true
        }"
        :empty="channelTotal === 0 ? '暂无消息渠道' : ''"
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <Tag :theme="row.status === 'active' ? 'success' : 'default'" variant="light" size="small">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </Tag>
        </template>
        <template #createdAt="{ row }">
          {{ row.createdAt.slice(0, 10) }}
        </template>
        <template #row-operation="{ row }">
          <a class="action-link" @click="handleEdit(row)">编辑</a>
          <Popconfirm
            :content="`确认${row.status === 'active' ? '停用' : '启用'}消息渠道「${row.name}」？`"
            :theme="row.status === 'active' ? 'warning' : 'default'"
            @confirm="handleToggleStatus(row)"
          >
            <a class="action-link" @click.stop>{{ row.status === 'active' ? '停用' : '启用' }}</a>
          </Popconfirm>
          <Popconfirm content="确认删除该消息渠道？删除后不可恢复。" theme="warning" @confirm="handleDelete(row)">
            <a class="action-link danger" @click.stop>删除</a>
          </Popconfirm>
        </template>
      </Table>
    </div>

    <!-- 新建/编辑弹窗 -->
    <Dialog v-model:visible="dialogVisible" :header="dialogTitle" width="480px" attach="body" @confirm="handleSave">
      <Form layout="vertical" class="channel-form">
        <FormItem label="渠道名称">
          <Input v-model="formData.name" placeholder="请输入渠道名称，1-50字符" :maxlength="50" />
        </FormItem>
        <FormItem label="渠道类型">
          <div class="radio-group">
            <label v-for="opt in channelTypeOptions" :key="opt.value" class="radio-item">
              <input type="radio" :value="opt.value" v-model="formData.type" :disabled="dialogMode === 'edit'" />
              {{ opt.label }}
            </label>
          </div>
        </FormItem>
        <FormItem label="平台名称">
          <Select v-model="formData.platformName" placeholder="请选择平台">
            <Option v-for="opt in platformOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </Select>
        </FormItem>
        <FormItem label="App Key">
          <Input v-model="formData.appKey" :placeholder="needsAppKey(formData.type) ? '请输入 App Key，全局唯一' : '站内信/短信/邮件可不填'" />
        </FormItem>
        <FormItem label="AppSecret">
          <Input v-model="formData.appSecret" type="password" :placeholder="dialogMode === 'create' ? '新建时必填' : '选填，为空表示不修改'" />
        </FormItem>
        <FormItem label="备注">
          <Textarea
            v-model="formData.remark"
            :maxlength="200"
            :show-limit-number="true"
            placeholder="200字以内"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </FormItem>
      </Form>
      <div v-if="formError" class="form-error">{{ formError }}</div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.message-channel-page {
  padding: 24px;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .table-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
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
    .radio-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .radio-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: var(--td-text-color-primary);
        cursor: pointer;

        input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
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
