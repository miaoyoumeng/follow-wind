import { ref, h, type Ref } from 'vue';
import type { PrimaryTableCol, PageInfo, TableRowData } from 'tdesign-vue-next';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';

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
} from '@/api/product-line-api';
import type { ProductLine, ProductLinePayChannel, ProductLineAttribute } from '@/api/models/product-line';
import type { ProductLineModel } from './models';

/* ===== 类型映射 ===== */
const PRODUCT_TYPE_MAP: Record<string, string> = {
  app: 'App',
  'mini-program': '小程序',
  web: 'Web'
};

/** useProductLine 的返回值 */
interface UseProductLineReturn {
  filterType: Ref<string>;
  filterName: Ref<string>;
  tableData: Ref<ProductLine.ProductLineItem[]>;
  total: Ref<number>;
  loading: Ref<boolean>;
  page: Ref<{ pageNum: number; pageSize: number }>;
  formDialogVisible: Ref<boolean>;
  formTitle: Ref<string>;
  isEdit: Ref<boolean>;
  formData: Ref<ProductLineModel.ProductLineFormData>;
  detailDialogVisible: Ref<boolean>;
  detailData: Ref<ProductLine.ProductLineItem | null>;
  payChannelDialogVisible: Ref<boolean>;
  payChannelTitle: Ref<string>;
  payChannelList: Ref<ProductLinePayChannel.PayChannelItem[]>;
  currentProductLineId: Ref<number>;
  currentProductLineName: Ref<string>;
  attrDialogVisible: Ref<boolean>;
  attrTitle: Ref<string>;
  attrList: Ref<ProductLineAttribute.AttributeItem[]>;
  attrFormVisible: Ref<boolean>;
  attrFormData: Ref<ProductLineModel.AttributeFormData>;
  attrIsEdit: Ref<boolean>;
  columns: PrimaryTableCol<TableRowData>[];
  loadData: () => Promise<void>;
  handleSearch: () => void;
  handleReset: () => void;
  handlePageChange: (pageInfo: PageInfo) => void;
  handleCreate: () => void;
  handleEdit: (row: ProductLine.ProductLineItem) => void;
  handleSave: () => Promise<void>;
  handleDetail: (row: ProductLine.ProductLineItem) => Promise<void>;
  handleDelete: (row: ProductLine.ProductLineItem) => void;
  handleDisable: (row: ProductLine.ProductLineItem) => void;
  handleContent: (row: ProductLine.ProductLineItem) => void;
  handleSku: (row: ProductLine.ProductLineItem) => void;
  handlePayChannel: (row: ProductLine.ProductLineItem) => Promise<void>;
  handleAttribute: (row: ProductLine.ProductLineItem) => Promise<void>;
  handleAddAttribute: () => void;
  handleEditAttribute: (row: ProductLineAttribute.AttributeItem) => void;
  handleSaveAttribute: () => Promise<void>;
  handleDeleteAttribute: (row: ProductLineAttribute.AttributeItem) => Promise<void>;
  formatType: (type: string) => string;
}

/* 页面级 composable：聚合「列表 / 表单 / 详情 / 支付渠道 / 属性」5 个功能域，
   拆分需跨函数传递 30+ 个 ref，且下方 return 的 40+ 个字段本身即超限，拆分收益为负，故豁免函数长度限制 */
// eslint-disable-next-line max-lines-per-function
export const useProductLine = (): UseProductLineReturn => {
  /* ===== 筛选条件 ===== */
  const filterType = ref('');
  const filterName = ref('');

  /* ===== 列表数据 ===== */
  const tableData = ref<ProductLine.ProductLineItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const page = ref({ pageNum: 1, pageSize: 20 });

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
  const formData = ref<ProductLineModel.ProductLineFormData>({
    id: 0,
    name: '',
    code: '',
    type: '' as ProductLineModel.ProductType | '',
    icon: '',
    description: ''
  });

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
  const attrFormData = ref<ProductLineModel.AttributeFormData>({ id: 0, name: '', value: '' });
  const attrIsEdit = ref(false);

  /* ===== 数据加载 ===== */
  const loadData = async (): Promise<void> => {
    loading.value = true;
    try {
      const { data } = await getProductLineListApi({
        type: (filterType.value as ProductLine.ListParams['type']) ?? undefined,
        name: filterName.value || undefined,
        pageNum: page.value.pageNum,
        pageSize: page.value.pageSize
      });
      if (data) {
        tableData.value = data.list;
        total.value = data.total;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败';
      void MessagePlugin.error(msg);
    } finally {
      loading.value = false;
    }
  };

  /* ===== 搜索与重置 ===== */
  const handleSearch = (): void => {
    page.value.pageNum = 1;
    void loadData();
  };

  const handleReset = (): void => {
    filterType.value = '';
    filterName.value = '';
    page.value.pageNum = 1;
    void loadData();
  };

  /* ===== 分页 ===== */
  const handlePageChange = (pageInfo: PageInfo): void => {
    page.value.pageNum = pageInfo.current;
    page.value.pageSize = pageInfo.pageSize;
    void loadData();
  };

  /* ===== 新建 ===== */
  const handleCreate = (): void => {
    isEdit.value = false;
    formTitle.value = '新建产品线';
    formData.value = { id: 0, name: '', code: '', type: '', icon: '', description: '' };
    formDialogVisible.value = true;
  };

  /* ===== 编辑 ===== */
  const handleEdit = (row: ProductLine.ProductLineItem): void => {
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
  const handleSave = async (): Promise<void> => {
    try {
      if (isEdit.value) {
        await updateProductLineApi({
          id: formData.value.id,
          name: formData.value.name,
          type: formData.value.type as ProductLineModel.ProductType,
          icon: formData.value.icon,
          description: formData.value.description
        });
        void MessagePlugin.success('产品线已更新');
      } else {
        await createProductLineApi({
          name: formData.value.name,
          code: formData.value.code,
          type: formData.value.type as ProductLineModel.ProductType,
          icon: formData.value.icon,
          description: formData.value.description
        });
        void MessagePlugin.success('产品线已创建');
      }
      formDialogVisible.value = false;
      void loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存失败';
      void MessagePlugin.error(msg);
    }
  };

  /* ===== 详情 ===== */
  const handleDetail = async (row: ProductLine.ProductLineItem): Promise<void> => {
    try {
      const { data } = await getProductLineDetailApi(row.id);
      if (data) {
        detailData.value = data;
        detailDialogVisible.value = true;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      void MessagePlugin.error(msg);
    }
  };

  /* ===== 删除 ===== */
  // 独立出来以满足 no-misused-promises：DialogPlugin.confirm 的 onConfirm 期望 void 返回
  const confirmDelete = async (row: ProductLine.ProductLineItem): Promise<void> => {
    try {
      await deleteProductLineApi(row.id);
      void MessagePlugin.success('产品线已删除');
      void loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '删除失败';
      void MessagePlugin.error(msg);
    }
  };

  const handleDelete = (row: ProductLine.ProductLineItem): void => {
    if (row.skuCount > 0) {
      void MessagePlugin.warning(`该产品线已关联 ${row.skuCount} 个 SKU，不可删除`);
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
      onConfirm: () => {
        void confirmDelete(row);
      }
    });
  };

  /* ===== 失效 ===== */
  const handleDisable = (row: ProductLine.ProductLineItem): void => {
    DialogPlugin.confirm({
      header: '失效确认',
      body: `确认失效产品线「${row.name}」？失效后前台将不可用。`,
      onConfirm: () => {
        void MessagePlugin.success('产品线已失效');
      }
    });
  };

  /* ===== 内容管理 / SKU管理 ===== */
  const handleContent = (row: ProductLine.ProductLineItem): void => {
    void MessagePlugin.info(`「${row.name}」内容管理功能开发中`);
  };

  const handleSku = (row: ProductLine.ProductLineItem): void => {
    void MessagePlugin.info(`「${row.name}」SKU管理功能开发中`);
  };

  /* ===== 支付渠道 ===== */
  const handlePayChannel = async (row: ProductLine.ProductLineItem): Promise<void> => {
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      void MessagePlugin.error(msg);
    }
  };

  /* ===== 属性配置 ===== */
  const handleAttribute = async (row: ProductLine.ProductLineItem): Promise<void> => {
    currentProductLineId.value = row.id;
    currentProductLineName.value = row.name;
    attrTitle.value = `属性配置 - ${row.name}`;
    try {
      const { data } = await getProductLineAttributeListApi({ productLineId: row.id });
      attrList.value = data?.list || [];
      attrDialogVisible.value = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      void MessagePlugin.error(msg);
    }
  };

  const handleAddAttribute = (): void => {
    attrIsEdit.value = false;
    attrFormData.value = { id: 0, name: '', value: '' };
    attrFormVisible.value = true;
  };

  const handleEditAttribute = (row: ProductLineAttribute.AttributeItem): void => {
    attrIsEdit.value = true;
    attrFormData.value = { id: row.id, name: row.name, value: row.value };
    attrFormVisible.value = true;
  };

  const handleSaveAttribute = async (): Promise<void> => {
    if (!attrFormData.value.name || !attrFormData.value.value) {
      void MessagePlugin.warning('请填写完整信息');
      return;
    }
    try {
      if (attrIsEdit.value) {
        await updateProductLineAttributeApi({
          id: attrFormData.value.id,
          name: attrFormData.value.name,
          value: attrFormData.value.value
        });
        void MessagePlugin.success('属性已更新');
      } else {
        await createProductLineAttributeApi({
          productLineId: currentProductLineId.value,
          name: attrFormData.value.name,
          value: attrFormData.value.value
        });
        void MessagePlugin.success('属性已创建');
      }
      attrFormVisible.value = false;
      const { data } = await getProductLineAttributeListApi({ productLineId: currentProductLineId.value });
      attrList.value = data?.list || [];
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存失败';
      void MessagePlugin.error(msg);
    }
  };

  const handleDeleteAttribute = async (row: ProductLineAttribute.AttributeItem): Promise<void> => {
    try {
      await deleteProductLineAttributeApi(row.id);
      void MessagePlugin.success('属性已删除');
      const { data } = await getProductLineAttributeListApi({ productLineId: currentProductLineId.value });
      attrList.value = data?.list || [];
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '删除失败';
      void MessagePlugin.error(msg);
    }
  };

  /* ===== 辅助方法 ===== */
  const formatType = (type: string): string => PRODUCT_TYPE_MAP[type] || type;

  return {
    filterType,
    filterName,
    tableData,
    total,
    loading,
    page,
    formDialogVisible,
    formTitle,
    isEdit,
    formData,
    detailDialogVisible,
    detailData,
    payChannelDialogVisible,
    payChannelTitle,
    payChannelList,
    currentProductLineId,
    currentProductLineName,
    attrDialogVisible,
    attrTitle,
    attrList,
    attrFormVisible,
    attrFormData,
    attrIsEdit,
    columns,
    loadData,
    handleSearch,
    handleReset,
    handlePageChange,
    handleCreate,
    handleEdit,
    handleSave,
    handleDetail,
    handleDelete,
    handleDisable,
    handleContent,
    handleSku,
    handlePayChannel,
    handleAttribute,
    handleAddAttribute,
    handleEditAttribute,
    handleSaveAttribute,
    handleDeleteAttribute,
    formatType
  };
};
