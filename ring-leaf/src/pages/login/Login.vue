<template>
  <t-layout class="layout-page">
    <t-header style="height: 80px">
      <div class="p-content-inner">
        <span class="welcome">欢迎登录</span>
        <span class="system">{{ systemName }}</span>
      </div>
    </t-header>
    <t-content>
      <div class="login-container">
        <div class="left-section"></div>
        <div class="right-section" style="background-color: transparent; height: 580px">
          <div class="login-box">
            <t-form ref="loginForm" :data="formData" :rules="formRules">
              <div class="text-left relative font-size-22 font-weight-600">账号密码登录</div>
              <t-divider />
              <t-form-item name="uid" label-width="2px">
                <t-input v-model="formData.uid" placeholder="用户名：admin / user" maxlength="50">
                  <template #prefix-icon>
                    <user-icon />
                  </template>
                </t-input>
              </t-form-item>
              <t-form-item name="password" label-width="2px">
                <t-input v-model="formData.password" type="password" placeholder="密码" maxlength="50">
                  <template #prefix-icon>
                    <lock-on-icon />
                  </template>
                </t-input>
              </t-form-item>
              <t-form-item :style="{ display: `flex`, justifyContent: `flex-end` }">
                <t-button block theme="primary" @click="submitLogin()" :style="{ width: '180px' }">登录</t-button>
              </t-form-item>
            </t-form>
          </div>
        </div>
      </div>
    </t-content>
    <t-footer style="height: 100px" />
  </t-layout>
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
@import 'index.scss';
</style>
