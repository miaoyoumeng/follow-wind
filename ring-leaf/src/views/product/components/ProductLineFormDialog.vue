<template>
  <Dialog :visible="visible" :header="title" width="560px" :footer="false" @update:visible="$emit('update:visible', $event)">
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
      <Button theme="default" @click="handleCancel">取消</Button>
      <Button theme="primary" @click="handleSave">确定</Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button, Dialog, Form, FormItem, Input, Option, Select, Upload } from 'tdesign-vue-next';
import type { ProductLineModel } from './types/models';

interface Props {
  visible: boolean;
  title: string;
  isEdit: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [];
}>();

/** 表单数据：通过 v-model:form-data 与父组件双向绑定 */
const formData = defineModel<ProductLineModel.ProductLineFormData>('formData', { required: true });

const formRef = ref<InstanceType<typeof Form> | null>(null);

const formRules = {
  name: [{ required: true, message: '请输入产品线名称', type: 'error' as const }],
  code: [
    { required: true, message: '请输入内部代号', type: 'error' as const },
    { pattern: /^[a-zA-Z0-9-]+$/, message: '仅支持英文字母、数字、减号', type: 'error' as const }
  ],
  type: [{ required: true, message: '请选择产品线类型', type: 'error' as const }]
};

const handleCancel = (): void => {
  emit('update:visible', false);
};

const handleSave = async (): Promise<void> => {
  const result = await (formRef.value as unknown as { validate: () => Promise<boolean> })?.validate?.();
  if (result === true) {
    emit('save');
  }
};

defineExpose({ formRef });
</script>

<style scoped lang="scss">
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
</style>
