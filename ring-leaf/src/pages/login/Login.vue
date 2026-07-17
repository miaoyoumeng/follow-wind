<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">管理平台登录</h1>
      <t-form ref="loginForm" :data="formData" :rules="formRules">
        <div class="form-subtitle">账号密码登录</div>
        <t-form-item name="uid" label-width="0">
          <t-input v-model="formData.uid" placeholder="用户名：admin / user" maxlength="50" size="large">
            <template #prefix-icon>
              <user-icon />
            </template>
          </t-input>
        </t-form-item>
        <t-form-item name="password" label-width="0">
          <t-input v-model="formData.password" type="password" placeholder="密码" maxlength="50" size="large">
            <template #prefix-icon>
              <lock-on-icon />
            </template>
          </t-input>
        </t-form-item>
        <t-form-item :style="{ marginTop: '24px' }">
          <t-button block theme="primary" @click="submitLogin()" size="large">登录</t-button>
        </t-form-item>
      </t-form>
      <div class="login-footer">&copy; 2026 {{ systemName }}</div>
    </div>
  </div>
</template>
<script setup lang="ts" name="login">
import { reactive, ref } from 'vue';
import { FormProps, FormInstanceFunctions } from 'tdesign-vue-next';

import { Login, formLogin } from '@/api/login.ts';

const systemName = import.meta.env.VITE_GLOB_APP_TITLE as string;

/* 表单数据 */
const formData = reactive<Login.ReqLoginForm>({
  uid: '',
  password: ''
});
/* 表单校验规则 */
const formRules: FormProps['rules'] = {
  uid: [
    {
      required: true,
      message: '请输入姓名'
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码'
    }
  ]
};

const loginForm = ref<FormInstanceFunctions>();
const submitLogin = async () => {
  // 执行登录接口
  loginForm.value?.validate().then(async valid => {
    if (valid && Object.keys(valid).length == 0) {
      await formLogin(formData);
    }
  });
};
</script>
<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 48px;
  width: 400px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 32px;
  text-align: center;
}

.form-subtitle {
  font-size: 14px;
  color: #8f929e;
  margin-bottom: 20px;
}

.login-footer {
  margin-top: 32px;
  font-size: 12px;
  color: #8f929e;
  text-align: center;
}

:deep(.t-form__label--required) {
  display: none !important;
}

:deep(.t-input__inner) {
  height: 40px;
  line-height: 40px;
}

:deep(.t-input) {
  height: 40px;
  line-height: 40px;
}
</style>
