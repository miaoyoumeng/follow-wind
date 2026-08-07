<script setup lang="ts" name="ProductLineManager">
import { ref, onMounted, h } from 'vue';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';
import { Table, Select, Option, Input, Button, Tag, Dialog, Form, FormItem, Upload } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo, TableRowData } from 'tdesign-vue-next';

import {
  getProductLineListApi,
  createProductLineApi,
  updateProductLineApi,
  deleteProductLineApi,
  getProductLineDetailApi,
  getProductLinePayChannelListApi,
  getProductLineAttributeListApi,
  createProductLineAttributeApi,
  updateProductLineAttributeApi,
  deleteProductLineAttributeApi
} from '@/api/modules/product-line';
import type { ProductLine, ProductLinePayChannel, ProductLineAttribute } from '@/api/modules/product-line';

/* ===== 筛选条件 ===== */
const filterType = ref('');
const filterName = ref('');

/* ===== 列表数据 ===== */
const tableData = ref<ProductLine.ProductLineItem[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref({ pageNum: 1, pageSize: 20 });

const PRODUCT_TYPE_MAP: Record<string, string> = {
  app: 'App',
  'mini-program': '小程序',
  web: 'Web'
};

/* ===== 表格列 ===== */
const columns: PrimaryTableCol<TableRowData>[] = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'icon', title: '主图', width: 70 },
  { colKey: 'name', title: '名称', minWidth: 140 },
  { colKey: 'code', title: '代号', width: 120 },
  { colKey: 'type', title: '类型', width: 90 },
  { colKey: 'status', title: '状态', width: 90 },
  { colKey: 'updatedAt', title: '修改时间', width: 160 },
  { colKey: 'updatedBy', title: '最后修改人', width: 100 },
  { colKey: 'row-operation', title: '操作', width: 400 }
];

/* ===== 新建/编辑弹窗 ===== */
const formDialogVisible = ref(false);
const formTitle = ref('新建产品线');
const isEdit = ref(false);
const formRef = ref();
const formData = ref({
  id: 0,
  name: '',
  code: '',
  type: '' as ProductLine.ProductLineItem['type'] | '',
  icon: '',
  description: ''
});

const formRules = {
  name: [{ required: true, message: '请输入产品线名称', type: 'error' as const }],
  code: [
    { required: true, message: '请输入内部代号', type: 'error' as const },
    { pattern: /^[a-zA-Z0-9-]+$/, message: '仅支持英文字母、数字、减号', type: 'error' as const }
  ],
  type: [{ required: true, message: '请选择产品线类型', type: 'error' as const }]
};

/* ===== 详情弹窗 ===== */
const detailDialogVisible = ref(false);
const detailData = ref<ProductLine.ProductLineItem | null>(null);

/* ===== 支付渠道弹窗 ===== */
const payChannelDialogVisible = ref(false);
const payChannelTitle = ref('');
const payChannelList = ref<ProductLinePayChannel.PayChannelItem[]>([]);
const currentProductLineId = ref(0);
const currentProductLineName = ref('');

/* ===== 属性配置弹窗 ===== */
const attrDialogVisible = ref(false);
const attrTitle = ref('');
const attrList = ref<ProductLineAttribute.AttributeItem[]>([]);
const attrFormVisible = ref(false);
const attrFormData = ref({ id: 0, name: '', value: '' });
const attrIsEdit = ref(false);

/* ===== 数据加载 ===== */
const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getProductLineListApi({
      type: (filterType.value as ProductLine.ListParams['type']) || undefined,
      name: filterName.value || undefined,
      pageNum: page.value.pageNum,
      pageSize: page.value.pageSize
    });
    if (data) {
      tableData.value = data.list;
      total.value = data.total;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

/* ===== 搜索与重置 ===== */
const handleSearch = () => {
  page.value.pageNum = 1;
  loadData();
};

const handleReset = () => {
  filterType.value = '';
  filterName.value = '';
  page.value.pageNum = 1;
  loadData();
};

/* ===== 分页 ===== */
const handlePageChange = (pageInfo: PageInfo) => {
  page.value.pageNum = pageInfo.current;
  page.value.pageSize = pageInfo.pageSize;
  loadData();
};

/* ===== 新建 ===== */
const handleCreate = () => {
  isEdit.value = false;
  formTitle.value = '新建产品线';
  formData.value = { id: 0, name: '', code: '', type: '', icon: '', description: '' };
  formDialogVisible.value = true;
};

/* ===== 编辑 ===== */
const handleEdit = (row: ProductLine.ProductLineItem) => {
  isEdit.value = true;
  formTitle.value = '编辑产品线';
  formData.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    icon: row.icon,
    description: row.description
  };
  formDialogVisible.value = true;
};

/* ===== 保存 ===== */
const handleSave = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;
  try {
    if (isEdit.value) {
      await updateProductLineApi({
        id: formData.value.id,
        name: formData.value.name,
        type: formData.value.type as ProductLine.ProductLineItem['type'],
        icon: formData.value.icon,
        description: formData.value.description
      });
      MessagePlugin.success('产品线已更新');
    } else {
      await createProductLineApi({
        name: formData.value.name,
        code: formData.value.code,
        type: formData.value.type as ProductLine.ProductLineItem['type'],
        icon: formData.value.icon,
        description: formData.value.description
      });
      MessagePlugin.success('产品线已创建');
    }
    formDialogVisible.value = false;
    loadData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '保存失败');
  }
};

/* ===== 详情 ===== */
const handleDetail = async (row: ProductLine.ProductLineItem) => {
  try {
    const { data } = await getProductLineDetailApi(row.id);
    if (data) {
      detailData.value = data;
      detailDialogVisible.value = true;
    }
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 删除 ===== */
const handleDelete = (row: ProductLine.ProductLineItem) => {
  if (row.skuCount > 0) {
    MessagePlugin.warning(`该产品线已关联 ${row.skuCount} 个 SKU，不可删除`);
    return;
  }
  DialogPlugin.confirm({
    header: '删除确认',
    body: () =>
      h('div', [
        h('p', { style: { margin: '0 0 8px', fontSize: '14px', color: 'var(--td-text-color-primary)' } }, `确认删除产品线「${row.name}」？`),
        h('p', { style: { margin: '0', fontSize: '13px', color: 'var(--td-error-color)' } }, '删除后不可恢复，请谨慎操作。')
      ]),
    confirmBtn: { content: '确认删除', theme: 'danger' },
    onConfirm: async () => {
      try {
        await deleteProductLineApi(row.id);
        MessagePlugin.success('产品线已删除');
        loadData();
      } catch (e: any) {
        MessagePlugin.error(e.message || '删除失败');
      }
    }
  });
};

/* ===== 失效 ===== */
const handleDisable = (row: ProductLine.ProductLineItem) => {
  DialogPlugin.confirm({
    header: '失效确认',
    body: `确认失效产品线「${row.name}」？失效后前台将不可用。`,
    onConfirm: () => {
      MessagePlugin.success('产品线已失效');
    }
  });
};

/* ===== 内容管理 / SKU管理 ===== */
const handleContent = (row: ProductLine.ProductLineItem) => {
  MessagePlugin.info(`「${row.name}」内容管理功能开发中`);
};

const handleSku = (row: ProductLine.ProductLineItem) => {
  MessagePlugin.info(`「${row.name}」SKU管理功能开发中`);
};

/* ===== 支付渠道 ===== */
const handlePayChannel = async (row: ProductLine.ProductLineItem) => {
  currentProductLineId.value = row.id;
  currentProductLineName.value = row.name;
  payChannelTitle.value = `支付渠道配置 - ${row.name}`;
  try {
    const { data } = await getProductLinePayChannelListApi({
      productLineId: row.id,
      pageNum: 1,
      pageSize: 100
    });
    payChannelList.value = data?.list || [];
    payChannelDialogVisible.value = true;
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

/* ===== 属性配置 ===== */
const handleAttribute = async (row: ProductLine.ProductLineItem) => {
  currentProductLineId.value = row.id;
  currentProductLineName.value = row.name;
  attrTitle.value = `属性配置 - ${row.name}`;
  try {
    const { data } = await getProductLineAttributeListApi({ productLineId: row.id });
    attrList.value = data?.list || [];
    attrDialogVisible.value = true;
  } catch (e: any) {
    MessagePlugin.error(e.message);
  }
};

const handleAddAttribute = () => {
  attrIsEdit.value = false;
  attrFormData.value = { id: 0, name: '', value: '' };
  attrFormVisible.value = true;
};

const handleEditAttribute = (row: ProductLineAttribute.AttributeItem) => {
  attrIsEdit.value = true;
  attrFormData.value = { id: row.id, name: row.name, value: row.value };
  attrFormVisible.value = true;
};

const handleSaveAttribute = async () => {
  if (!attrFormData.value.name || !attrFormData.value.value) {
    MessagePlugin.warning('请填写完整信息');
    return;
  }
  try {
    if (attrIsEdit.value) {
      await updateProductLineAttributeApi({
        id: attrFormData.value.id,
        name: attrFormData.value.name,
        value: attrFormData.value.value
      });
      MessagePlugin.success('属性已更新');
    } else {
      await createProductLineAttributeApi({
        productLineId: currentProductLineId.value,
        name: attrFormData.value.name,
        value: attrFormData.value.value
      });
      MessagePlugin.success('属性已创建');
    }
    attrFormVisible.value = false;
    const { data } = await getProductLineAttributeListApi({ productLineId: currentProductLineId.value });
    attrList.value = data?.list || [];
  } catch (e: any) {
    MessagePlugin.error(e.message || '保存失败');
  }
};

const handleDeleteAttribute = async (row: ProductLineAttribute.AttributeItem) => {
  try {
    await deleteProductLineAttributeApi(row.id);
    MessagePlugin.success('属性已删除');
    const { data } = await getProductLineAttributeListApi({ productLineId: currentProductLineId.value });
    attrList.value = data?.list || [];
  } catch (e: any) {
    MessagePlugin.error(e.message || '删除失败');
  }
};

/* ===== 辅助方法 ===== */
const formatType = (type: string) => PRODUCT_TYPE_MAP[type] || type;

/* ===== 初始化 ===== */
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="product-line-page">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">类型</span>
        <Select v-model="filterType" placeholder="全部" clearable style="width: 140px">
          <Option value="" label="全部" />
          <Option value="app" label="App" />
          <Option value="mini-program" label="小程序" />
          <Option value="web" label="Web" />
        </Select>
      </div>
      <div class="filter-item">
        <span class="filter-label">名称</span>
        <Input v-model="filterName" placeholder="请输入名称关键字" clearable style="width: 180px" />
      </div>
      <Button theme="primary" @click="handleSearch">搜索</Button>
      <Button theme="default" @click="handleReset">重置</Button>
      <div class="filter-spacer" />
      <Button theme="primary" @click="handleCreate">+ 新建产品线</Button>
    </div>

    <!-- 列表 -->
    <div class="table-card">
      <Table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :hover="true"
        :stripe="false"
        :bordered="false"
        :pagination="{
          current: page.pageNum,
          pageSize: page.pageSize,
          total,
          pageSizeOptions: [20, 50, 100],
          showJumper: true
        }"
        :empty="total === 0 ? '暂无产品线' : ''"
        @page-change="handlePageChange"
      >
        <template #icon="{ row }">
          <div class="product-thumb">
            <img v-if="row.icon" :src="row.icon" alt="" />
            <span v-else class="thumb-placeholder">图片</span>
          </div>
        </template>
        <template #name="{ row }">
          <a class="name-link" @click="handleDetail(row)">{{ row.name }}</a>
        </template>
        <template #type="{ row }">
          <span>{{ formatType(row.type) }}</span>
        </template>
        <template #status="{ row }">
          <Tag v-if="row.status === 'enabled'" theme="success" variant="light" size="small">有效</Tag>
          <Tag v-else theme="warning" variant="light" size="small">待编辑</Tag>
        </template>
        <template #row-operation="{ row }">
          <a class="action-link" @click="handleDetail(row)">查看</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleEdit(row)">编辑</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleAttribute(row)">属性管理</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handlePayChannel(row)">支付渠道</a>
          <span class="action-separator">|</span>
          <a v-if="row.status === 'enabled'" class="action-link" @click="handleDisable(row)">失效</a>
          <a v-else class="action-link action-danger" @click="handleDelete(row)">删除</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleContent(row)">内容管理</a>
          <span class="action-separator">|</span>
          <a class="action-link" @click="handleSku(row)">SKU管理</a>
        </template>
      </Table>
    </div>

    <!-- 新建/编辑弹窗 -->
    <Dialog v-model:visible="formDialogVisible" :header="formTitle" width="560px" :footer="false">
      <Form ref="formRef" :data="formData" :rules="formRules" label-align="top">
        <FormItem label="产品线名称" name="name">
          <div class="form-field">
            <Input v-model="formData.name" placeholder="请输入产品线名称，最长20个字" :maxlength="20" />
            <div class="form-hint">最长20个字</div>
          </div>
        </FormItem>
        <FormItem v-if="!isEdit" label="内部代号" name="code">
          <div class="form-field">
            <Input v-model="formData.code" placeholder="唯一标识，仅新建时可编辑，英文字母、数字、减号" :maxlength="64" />
            <div class="form-hint">全局唯一标识符，最长64个字符，创建后不可修改</div>
          </div>
        </FormItem>
        <FormItem v-else label="内部代号">
          <div class="form-field">
            <Input :model-value="formData.code" disabled />
            <div class="form-hint">创建后不可修改</div>
          </div>
        </FormItem>
        <FormItem label="产品线类型" name="type">
          <Select v-model="formData.type" placeholder="请选择产品类型">
            <Option value="app" label="App" />
            <Option value="mini-program" label="小程序" />
            <Option value="web" label="Web" />
          </Select>
        </FormItem>
        <FormItem label="商品主图">
          <div class="form-field">
            <div class="upload-wrap">
              <Upload :auto-upload="false">
                <Button theme="default" variant="outline">上传</Button>
              </Upload>
              <div class="upload-preview">预览图</div>
            </div>
            <div class="form-hint">建议尺寸 200x200px，支持 JPG/PNG，不超过 2MB</div>
          </div>
        </FormItem>
        <FormItem label="产品线描述">
          <div class="form-field">
            <textarea v-model="formData.description" class="form-textarea" :maxlength="500" placeholder="请输入产品线描述，最多500个字" />
            <div class="form-hint">最多500个字</div>
          </div>
        </FormItem>
      </Form>
      <div class="dialog-footer">
        <Button theme="default" @click="formDialogVisible = false">取消</Button>
        <Button theme="primary" @click="handleSave">确定</Button>
      </div>
    </Dialog>

    <!-- 详情弹窗 -->
    <Dialog v-model:visible="detailDialogVisible" header="产品线详情" width="640px" :footer="false">
      <div v-if="detailData" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">ID</span>
          <span class="detail-value detail-code">{{ detailData.id }}</span>
        </div>
        <div class="detail-row detail-full">
          <span class="detail-label">主图</span>
          <span class="detail-value">
            <span class="detail-thumb">
              <img v-if="detailData.icon" :src="detailData.icon" alt="" />
              <template v-else>主图</template>
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">名称</span>
          <span class="detail-value">{{ detailData.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">代号</span>
          <span class="detail-value detail-code">{{ detailData.code }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">类型</span>
          <span class="detail-value">{{ formatType(detailData.type) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span class="detail-value">
            <Tag v-if="detailData.status === 'enabled'" theme="success" variant="light" size="small">有效</Tag>
            <Tag v-else theme="warning" variant="light" size="small">待编辑</Tag>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">修改时间</span>
          <span class="detail-value detail-muted">{{ detailData.updatedAt }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">最后修改人</span>
          <span class="detail-value detail-muted">{{ detailData.updatedBy }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建人</span>
          <span class="detail-value detail-muted">{{ detailData.createdBy }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建时间</span>
          <span class="detail-value detail-muted">{{ detailData.createdAt }}</span>
        </div>
        <div class="detail-row detail-full">
          <span class="detail-label">描述</span>
          <span class="detail-value">{{ detailData.description || '-' }}</span>
        </div>
      </div>
      <div class="dialog-footer">
        <Button theme="primary" @click="detailDialogVisible = false">关闭</Button>
      </div>
    </Dialog>

    <!-- 支付渠道弹窗 -->
    <Dialog v-model:visible="payChannelDialogVisible" :header="payChannelTitle" width="760px" :footer="false">
      <div v-if="payChannelList.length > 0">
        <table class="inner-table">
          <thead>
            <tr>
              <th style="width: 120px">支付渠道</th>
              <th>商户号/AppID</th>
              <th style="width: 180px">公司主体</th>
              <th style="width: 80px; text-align: center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in payChannelList" :key="item.id">
              <td>{{ item.channelName }}</td>
              <td class="mono-cell">{{ item.merchantId }}</td>
              <td>{{ item.companyName }}</td>
              <td style="text-align: center">
                <a class="action-link">编辑</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-inner">暂无绑定</div>
      <div class="dialog-footer">
        <Button theme="default" @click="payChannelDialogVisible = false">关闭</Button>
        <Button theme="primary">+ 新增绑定</Button>
      </div>
    </Dialog>

    <!-- 属性配置弹窗 -->
    <Dialog v-model:visible="attrDialogVisible" :header="attrTitle" width="560px" :footer="false">
      <!-- 属性表单弹窗 -->
      <Dialog v-model:visible="attrFormVisible" :header="attrIsEdit ? '编辑属性' : '新增属性'" width="480px" :footer="false">
        <Form :data="attrFormData" label-align="top">
          <FormItem label="属性名称">
            <Input v-model="attrFormData.name" placeholder="请输入属性名称" />
          </FormItem>
          <FormItem label="属性值">
            <Input v-model="attrFormData.value" placeholder="请输入属性值" />
          </FormItem>
        </Form>
        <div class="dialog-footer">
          <Button theme="default" @click="attrFormVisible = false">取消</Button>
          <Button theme="primary" @click="handleSaveAttribute">确定</Button>
        </div>
      </Dialog>

      <div v-if="attrList.length > 0">
        <table class="inner-table">
          <thead>
            <tr>
              <th>属性名称</th>
              <th>属性值</th>
              <th style="width: 120px; text-align: center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in attrList" :key="item.id">
              <td>{{ item.name }}</td>
              <td class="mono-cell">{{ item.value }}</td>
              <td style="text-align: center">
                <a class="action-link" @click="handleEditAttribute(item)">编辑</a>
                <span class="action-separator">|</span>
                <a class="action-link action-danger" @click="handleDeleteAttribute(item)">删除</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-inner">暂无属性</div>
      <div class="dialog-footer">
        <Button theme="default" @click="attrDialogVisible = false">关闭</Button>
        <Button theme="primary" @click="handleAddAttribute">+ 新增属性</Button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.product-line-page {
  padding: 24px;

  .filter-bar {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
    border: 1px solid var(--td-component-stroke);
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

    .filter-spacer {
      flex: 1;
    }
  }

  .table-card {
    background: var(--td-bg-color-container);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .product-thumb {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--td-bg-color-secondarycontainer);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      color: var(--td-text-color-placeholder);
      font-size: 11px;
    }
  }

  .name-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  .action-link {
    color: var(--td-brand-color);
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }

  .action-danger {
    color: var(--td-error-color);
  }

  .action-separator {
    color: var(--td-component-stroke);
    margin: 0 4px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-stroke);
    margin-top: 16px;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .form-hint {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  .form-textarea {
    width: 100%;
    min-height: 80px;
    padding: 8px 12px;
    border: 1px solid var(--td-component-stroke);
    border-radius: 4px;
    font-size: 14px;
    color: var(--td-text-color-primary);
    background: var(--td-bg-color-container);
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--td-brand-color);
    }

    &::placeholder {
      color: var(--td-text-color-placeholder);
    }
  }

  .upload-wrap {
    display: flex;
    align-items: center;
  }

  .upload-preview {
    width: 64px;
    height: 64px;
    border-radius: 6px;
    background: var(--td-bg-color-secondarycontainer);
    margin-left: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--td-text-color-placeholder);
    font-size: 12px;
  }

  .detail-content {
    display: grid;
    grid-template-columns: 1fr 1fr;

    .detail-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid var(--td-component-stroke);

      .detail-label {
        width: 120px;
        color: var(--td-text-color-secondary);
        font-size: 13px;
        flex-shrink: 0;
      }

      .detail-value {
        flex: 1;
        color: var(--td-text-color-primary);
        font-size: 13px;
        word-break: break-all;
      }

      .detail-code {
        font-family: 'Fira Code', Menlo, monospace;
      }

      .detail-muted {
        color: var(--td-text-color-placeholder);
      }

      .detail-thumb {
        width: 80px;
        height: 80px;
        border-radius: 6px;
        background: var(--td-bg-color-secondarycontainer);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--td-text-color-placeholder);
        font-size: 12px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
        }
      }
    }

    .detail-full {
      grid-column: 1 / -1;
    }
  }

  .inner-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    thead th {
      background: var(--td-bg-color-container-hover);
      padding: 10px 12px;
      text-align: left;
      font-weight: 500;
      color: var(--td-text-color-secondary);
      border-bottom: 1px solid var(--td-component-stroke);
    }

    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--td-component-stroke);
      color: var(--td-text-color-primary);
    }

    tbody tr:hover {
      background: var(--td-bg-color-container-hover);
    }
  }

  .mono-cell {
    font-family: 'Fira Code', Menlo, monospace;
  }

  .empty-inner {
    text-align: center;
    padding: 32px;
    color: var(--td-text-color-placeholder);
    font-size: 13px;
  }
}
</style>
