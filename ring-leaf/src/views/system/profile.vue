<script setup lang="ts" name="PersonalCenter">
import { ref, onMounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { Card, Dialog, Button, Tag, Table, Input, Form, FormItem, Loading } from 'tdesign-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';

import { getProfileInfoApi, getRecentLogsApi, getAllLogsApi, changeWechatApi, bindPhoneApi, getSmsCodeApi, setPasswordApi } from '@/api/user.ts';
import type { Profile } from '@/api/modules/user.ts';

/* ===== 个人信息 ===== */
const profileInfo = ref<Profile.ProfileInfo | null>(null);

/* ===== 操作日志 ===== */
const recentLogs = ref<Profile.OperationLog[]>([]);
const allLogs = ref<Profile.OperationLog[]>([]);

/* ===== 更换微信弹窗 ===== */
const wechatDialogVisible = ref(false);
const wechatScanStatus = ref<'waiting' | 'scanned' | 'success' | 'failed'>('waiting');
const wechatErrorMsg = ref('');

/* ===== 绑定手机号弹窗 ===== */
const phoneDialogVisible = ref(false);
const newPhone = ref('');
const smsCode = ref('');
const smsCountdown = ref(0);
let smsTimer: ReturnType<typeof setInterval> | null = null;

/* ===== 设置密码弹窗 ===== */
const passwordDialogVisible = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');

/* ===== 查看全部日志弹窗 ===== */
const allLogsDialogVisible = ref(false);
const allLogsLoading = ref(false);

/* ===== 密码校验 ===== */
const validatePassword = (pwd: string): { valid: boolean; error: string } => {
  if (pwd.length < 8 || pwd.length > 20) {
    return { valid: false, error: '密码长度为8-20位' };
  }
  if (/\s/.test(pwd)) {
    return { valid: false, error: '密码不允许包含空格' };
  }
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  if (!hasLetter || !hasDigit) {
    return { valid: false, error: '密码需包含至少1个字母和1个数字' };
  }
  return { valid: true, error: '' };
};

/* ===== 数据加载 ===== */
const loadProfile = async () => {
  const { data } = await getProfileInfoApi();
  if (data) {
    profileInfo.value = data;
  }
};

const loadRecentLogs = async () => {
  const { data } = await getRecentLogsApi();
  if (data) {
    recentLogs.value = data.list;
  }
};

/* ===== 交互处理 ===== */
const handleReplaceWechat = () => {
  wechatDialogVisible.value = true;
  wechatScanStatus.value = 'waiting';
  wechatErrorMsg.value = '';
};

const confirmReplaceWechat = async () => {
  // 模拟扫码成功后的确认
  wechatScanStatus.value = 'scanned';
  try {
    await changeWechatApi();
    wechatScanStatus.value = 'success';
    MessagePlugin.success('微信账号已更换');
    setTimeout(() => {
      wechatDialogVisible.value = false;
      loadProfile();
    }, 1000);
  } catch {
    wechatScanStatus.value = 'failed';
    wechatErrorMsg.value = '绑定失败，请重试';
  }
};

const handleBindPhone = () => {
  phoneDialogVisible.value = true;
  newPhone.value = '';
  smsCode.value = '';
  smsCountdown.value = 0;
};

const handleGetSmsCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(newPhone.value)) {
    MessagePlugin.warning('请输入正确的11位手机号');
    return;
  }
  if (smsCountdown.value > 0) return;
  try {
    await getSmsCodeApi(newPhone.value);
    MessagePlugin.success('验证码已发送');
    smsCountdown.value = 60;
    smsTimer = setInterval(() => {
      smsCountdown.value--;
      if (smsCountdown.value <= 0 && smsTimer) {
        clearInterval(smsTimer);
        smsTimer = null;
      }
    }, 1000);
  } catch {
    MessagePlugin.error('验证码发送失败');
  }
};

const confirmBindPhone = async () => {
  if (!/^1[3-9]\d{9}$/.test(newPhone.value)) {
    MessagePlugin.warning('请输入正确的11位手机号');
    return;
  }
  if (!/^\d{4,6}$/.test(smsCode.value)) {
    MessagePlugin.warning('请输入正确的验证码');
    return;
  }
  try {
    await bindPhoneApi({ phone: newPhone.value, code: smsCode.value });
    MessagePlugin.success('手机号已更新');
    phoneDialogVisible.value = false;
    loadProfile();
  } catch {
    MessagePlugin.error('绑定失败，该手机号可能已被其他员工使用');
  }
};

const handleSetPassword = () => {
  passwordDialogVisible.value = true;
  newPassword.value = '';
  confirmPassword.value = '';
  passwordError.value = '';
};

const handlePasswordInput = () => {
  const result = validatePassword(newPassword.value);
  passwordError.value = result.valid ? '' : result.error;
};

const confirmSetPassword = async () => {
  const result = validatePassword(newPassword.value);
  if (!result.valid) {
    passwordError.value = result.error;
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '确认密码与新密码不一致';
    return;
  }
  try {
    await setPasswordApi({ password: newPassword.value });
    MessagePlugin.success('密码已设置');
    passwordDialogVisible.value = false;
    loadProfile();
  } catch {
    MessagePlugin.error('密码设置失败');
  }
};

const handleViewAllLogs = async () => {
  allLogsDialogVisible.value = true;
  allLogsLoading.value = true;
  try {
    const { data } = await getAllLogsApi();
    if (data) {
      allLogs.value = data;
    }
  } finally {
    allLogsLoading.value = false;
  }
};

/* ===== 日志表格列 ===== */
const logColumns: PrimaryTableCol[] = [
  { colKey: 'time', title: '时间', width: 200 },
  { colKey: 'type', title: '操作类型', width: 120 },
  { colKey: 'content', title: '操作内容' }
];

/* ===== 初始化 ===== */
onMounted(() => {
  loadProfile();
  loadRecentLogs();
});
</script>

<template>
  <div class="profile-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">个人中心</h2>
    </div>

    <!-- 基本信息 -->
    <Card class="profile-card" :bordered="false">
      <template #header>
        <div class="card-header">基本信息</div>
      </template>
      <div v-if="profileInfo" class="detail-grid">
        <!-- 用户 ID -->
        <div class="detail-row">
          <span class="detail-label">用户 ID</span>
          <span class="detail-value">{{ profileInfo.userId }}</span>
        </div>
        <!-- 用户名称 -->
        <div class="detail-row">
          <span class="detail-label">用户名称</span>
          <span class="detail-value">{{ profileInfo.userName }}</span>
        </div>
        <!-- 姓名 -->
        <div class="detail-row">
          <span class="detail-label">姓名</span>
          <span class="detail-value">{{ profileInfo.name }}</span>
        </div>
        <!-- 手机号 -->
        <div class="detail-row">
          <span class="detail-label">手机号</span>
          <span class="detail-value">
            {{ profileInfo.phone }}
            <Button variant="outline" size="small" @click="handleBindPhone">绑定手机号</Button>
          </span>
        </div>
        <!-- 绑定微信 -->
        <div class="detail-row">
          <span class="detail-label">绑定微信</span>
          <span class="detail-value">
            {{ profileInfo.wechatNickname }}（微信号: {{ profileInfo.wechatId }}）
            <Button variant="outline" size="small" @click="handleReplaceWechat">更换微信</Button>
          </span>
        </div>
        <!-- 密码 -->
        <div class="detail-row">
          <span class="detail-label">密码</span>
          <span class="detail-value">
            <Tag v-if="profileInfo.passwordSet" theme="success" variant="light" size="small">已设置</Tag>
            <Tag v-else theme="warning" variant="light" size="small">未设置</Tag>
            <Button variant="outline" size="small" @click="handleSetPassword">
              {{ profileInfo.passwordSet ? '修改密码' : '设置密码' }}
            </Button>
          </span>
        </div>
        <!-- 角色 -->
        <div class="detail-row">
          <span class="detail-label">角色</span>
          <span class="detail-value">
            <Tag theme="primary" variant="light" size="small">{{ profileInfo.role }}</Tag>
          </span>
        </div>
        <!-- 负责一级渠道 -->
        <div class="detail-row">
          <span class="detail-label">负责一级渠道</span>
          <span class="detail-value">{{ profileInfo.channels.join('、') }}</span>
        </div>
        <!-- 入职日期 -->
        <div class="detail-row">
          <span class="detail-label">入职日期</span>
          <span class="detail-value">{{ profileInfo.joinDate }}</span>
        </div>
        <!-- 在职时长 -->
        <div class="detail-row">
          <span class="detail-label">在职时长</span>
          <span class="detail-value">{{ profileInfo.tenure }}</span>
        </div>
      </div>
    </Card>

    <!-- 操作日志 -->
    <Card class="log-card" :bordered="false">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <a class="action-link" @click="handleViewAllLogs">查看全部</a>
        </div>
      </template>
      <Table :data="recentLogs" :columns="logColumns" row-key="id" :hover="true" empty="暂无操作记录" />
    </Card>

    <!-- 更换微信弹窗 -->
    <Dialog v-model:visible="wechatDialogVisible" header="更换微信账号" width="480px" attach="body">
      <div class="wechat-dialog">
        <div class="current-wechat">
          当前绑定微信：<strong>{{ profileInfo?.wechatId }}</strong>
        </div>
        <div class="qr-section">
          <div v-if="wechatScanStatus === 'waiting'" class="qr-placeholder">
            <div class="qr-icon">
              <svg viewBox="0 0 1024 1024" width="48" height="48" fill="#c5c6d0">
                <path
                  d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zM752 752H272v-80h480v80zm48-160H272v-80h528v80zm0-160H272v-80h528v80z"
                />
              </svg>
            </div>
            <p class="qr-text">请扫描下方二维码绑定新微信账号</p>
            <div class="qr-code">
              <svg viewBox="0 0 200 200" width="160" height="160">
                <rect width="200" height="200" fill="#fff" />
                <!-- 模拟二维码图案 -->
                <rect x="10" y="10" width="50" height="50" fill="#000" rx="4" />
                <rect x="14" y="14" width="42" height="42" fill="#fff" rx="2" />
                <rect x="20" y="20" width="30" height="30" fill="#000" rx="2" />
                <rect x="140" y="10" width="50" height="50" fill="#000" rx="4" />
                <rect x="144" y="14" width="42" height="42" fill="#fff" rx="2" />
                <rect x="150" y="20" width="30" height="30" fill="#000" rx="2" />
                <rect x="10" y="140" width="50" height="50" fill="#000" rx="4" />
                <rect x="14" y="144" width="42" height="42" fill="#fff" rx="2" />
                <rect x="20" y="150" width="30" height="30" fill="#000" rx="2" />
                <!-- 随机方块模拟二维码 -->
                <rect x="70" y="10" width="10" height="10" fill="#000" />
                <rect x="90" y="10" width="10" height="10" fill="#000" />
                <rect x="110" y="10" width="10" height="10" fill="#000" />
                <rect x="70" y="30" width="10" height="10" fill="#000" />
                <rect x="100" y="30" width="10" height="10" fill="#000" />
                <rect x="70" y="50" width="10" height="10" fill="#000" />
                <rect x="90" y="50" width="10" height="10" fill="#000" />
                <rect x="10" y="70" width="10" height="10" fill="#000" />
                <rect x="30" y="70" width="10" height="10" fill="#000" />
                <rect x="50" y="70" width="10" height="10" fill="#000" />
                <rect x="70" y="70" width="10" height="10" fill="#000" />
                <rect x="90" y="70" width="10" height="10" fill="#000" />
                <rect x="110" y="70" width="10" height="10" fill="#000" />
                <rect x="130" y="70" width="10" height="10" fill="#000" />
                <rect x="150" y="70" width="10" height="10" fill="#000" />
                <rect x="170" y="70" width="10" height="10" fill="#000" />
                <rect x="10" y="90" width="10" height="10" fill="#000" />
                <rect x="40" y="90" width="10" height="10" fill="#000" />
                <rect x="70" y="90" width="10" height="10" fill="#000" />
                <rect x="100" y="90" width="10" height="10" fill="#000" />
                <rect x="130" y="90" width="10" height="10" fill="#000" />
                <rect x="160" y="90" width="10" height="10" fill="#000" />
                <rect x="20" y="110" width="10" height="10" fill="#000" />
                <rect x="50" y="110" width="10" height="10" fill="#000" />
                <rect x="80" y="110" width="10" height="10" fill="#000" />
                <rect x="110" y="110" width="10" height="10" fill="#000" />
                <rect x="140" y="110" width="10" height="10" fill="#000" />
                <rect x="170" y="110" width="10" height="10" fill="#000" />
                <rect x="10" y="130" width="10" height="10" fill="#000" />
                <rect x="30" y="130" width="10" height="10" fill="#000" />
                <rect x="70" y="130" width="10" height="10" fill="#000" />
                <rect x="100" y="130" width="10" height="10" fill="#000" />
                <rect x="120" y="130" width="10" height="10" fill="#000" />
                <rect x="150" y="130" width="10" height="10" fill="#000" />
                <rect x="70" y="150" width="10" height="10" fill="#000" />
                <rect x="90" y="150" width="10" height="10" fill="#000" />
                <rect x="110" y="150" width="10" height="10" fill="#000" />
                <rect x="130" y="150" width="10" height="10" fill="#000" />
                <rect x="150" y="150" width="10" height="10" fill="#000" />
                <rect x="70" y="170" width="10" height="10" fill="#000" />
                <rect x="100" y="170" width="10" height="10" fill="#000" />
                <rect x="130" y="170" width="10" height="10" fill="#000" />
                <rect x="170" y="170" width="10" height="10" fill="#000" />
              </svg>
            </div>
          </div>
          <div v-else-if="wechatScanStatus === 'scanned'" class="qr-status qr-scanned">
            <Loading size="large" />
            <p>正在验证新微信身份...</p>
          </div>
          <div v-else-if="wechatScanStatus === 'success'" class="qr-status qr-success">
            <svg viewBox="0 0 1024 1024" width="48" height="48" fill="#00b42a">
              <path
                d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.2 328.4l-231 231c-4.2 4.2-9.7 6.4-15.3 6.4s-11.1-2.1-15.3-6.4L199.4 479.2c-8.4-8.4-8.4-22 0-30.4 8.4-8.4 22-8.4 30.4 0l229.2 229.2 215.8-215.8c8.4-8.4 22-8.4 30.4 0 8.5 8.4 8.5 22 0 30.2z"
              />
            </svg>
            <p>微信账号已更换</p>
          </div>
          <div v-else-if="wechatScanStatus === 'failed'" class="qr-status qr-failed">
            <svg viewBox="0 0 1024 1024" width="48" height="48" fill="#e34d59">
              <path
                d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-2.2.8-4.2 2.3-5.7L448 540.2 339.8 412c-1.5-1.6-2.3-3.6-2.3-5.7 0-4.4 3.6-8 8-8l66 .3L512 517l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 2.2-.8 4.2-2.3 5.7L576 540.2l108.2 128.2c1.5 1.6 2.3 3.6 2.3 5.7.1 4.5-3.5 8.1-7.9 8.1z"
              />
            </svg>
            <p>{{ wechatErrorMsg || '扫码失败，请重试' }}</p>
            <Button theme="primary" size="small" @click="wechatScanStatus = 'waiting'">重新扫码</Button>
          </div>
        </div>
      </div>
      <template #footer>
        <Button v-if="wechatScanStatus === 'waiting'" theme="default" @click="wechatDialogVisible = false">取消</Button>
        <Button v-if="wechatScanStatus === 'waiting'" theme="primary" @click="confirmReplaceWechat">确认</Button>
        <Button v-if="wechatScanStatus === 'success'" theme="primary" @click="wechatDialogVisible = false">关闭</Button>
      </template>
    </Dialog>

    <!-- 绑定手机号弹窗 -->
    <Dialog v-model:visible="phoneDialogVisible" header="绑定手机号" width="480px" attach="body">
      <div class="phone-dialog">
        <div class="current-phone">
          当前绑定手机号：<strong>{{ profileInfo?.phone }}</strong>
        </div>
        <Form layout="vertical" class="phone-form">
          <FormItem label="新手机号">
            <Input v-model="newPhone" placeholder="请输入11位手机号" maxlength="11" />
          </FormItem>
          <FormItem label="验证码">
            <div class="sms-row">
              <Input v-model="smsCode" placeholder="请输入短信验证码" maxlength="6" />
              <Button :disabled="smsCountdown > 0" @click="handleGetSmsCode">
                {{ smsCountdown > 0 ? `${smsCountdown}s后重新获取` : '获取验证码' }}
              </Button>
            </div>
          </FormItem>
        </Form>
      </div>
      <template #footer>
        <Button theme="default" @click="phoneDialogVisible = false">取消</Button>
        <Button theme="primary" @click="confirmBindPhone">确认</Button>
      </template>
    </Dialog>

    <!-- 设置密码弹窗 -->
    <Dialog v-model:visible="passwordDialogVisible" :header="profileInfo?.passwordSet ? '修改密码' : '设置密码'" width="480px" attach="body">
      <div class="password-dialog">
        <div class="current-status">
          当前状态：<strong>{{ profileInfo?.passwordSet ? '已设置' : '未设置' }}</strong>
        </div>
        <Form layout="vertical" class="password-form">
          <FormItem label="新密码">
            <Input v-model="newPassword" type="password" placeholder="请输入新密码" @input="handlePasswordInput" />
          </FormItem>
          <FormItem label="确认密码">
            <Input v-model="confirmPassword" type="password" placeholder="请再次输入新密码" @input="handlePasswordInput" />
          </FormItem>
        </Form>
        <div v-if="passwordError" class="password-error">{{ passwordError }}</div>
        <div class="password-hint">密码要求：8-20位，包含字母和数字，不允许包含空格</div>
      </div>
      <template #footer>
        <Button theme="default" @click="passwordDialogVisible = false">取消</Button>
        <Button theme="primary" @click="confirmSetPassword">确认</Button>
      </template>
    </Dialog>

    <!-- 查看全部日志弹窗 -->
    <Dialog v-model:visible="allLogsDialogVisible" header="操作日志" width="720px" attach="body">
      <div v-if="allLogsLoading" class="logs-loading">
        <Loading size="large" text="加载中..." />
      </div>
      <Table v-else :data="allLogs" :columns="logColumns" row-key="id" :hover="true" empty="暂无操作记录" />
      <template #footer>
        <Button theme="default" @click="allLogsDialogVisible = false">关闭</Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  padding: 24px;

  .page-header {
    margin-bottom: 24px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

  .profile-card,
  .log-card {
    margin-bottom: 24px;

    .card-header {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .action-link {
        color: var(--td-brand-color);
        cursor: pointer;
        text-decoration: none;
        font-size: 14px;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .detail-grid {
    padding: 0 8px;

    .detail-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--td-component-stroke);

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        color: var(--td-text-color-placeholder);
        font-size: 14px;
      }

      .detail-value {
        color: var(--td-text-color-primary);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
  }

  /* 更换微信弹窗 */
  .wechat-dialog {
    .current-wechat {
      font-size: 14px;
      color: var(--td-text-color-secondary);
      margin-bottom: 20px;
    }

    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;

      .qr-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .qr-icon {
          margin-bottom: 8px;
        }

        .qr-text {
          font-size: 14px;
          color: var(--td-text-color-secondary);
        }

        .qr-code {
          padding: 12px;
          border: 1px solid var(--td-component-stroke);
          border-radius: 8px;
          background: #fff;
        }
      }

      .qr-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 40px 0;

        p {
          font-size: 14px;
          color: var(--td-text-color-secondary);
        }

        &.qr-success p {
          color: var(--td-success-color);
        }

        &.qr-failed p {
          color: var(--td-error-color);
        }
      }
    }
  }

  /* 绑定手机号弹窗 */
  .phone-dialog {
    .current-phone {
      font-size: 14px;
      color: var(--td-text-color-secondary);
      margin-bottom: 20px;
    }

    .phone-form {
      .sms-row {
        display: flex;
        gap: 8px;

        :deep(.t-input) {
          flex: 1;
        }
      }
    }
  }

  /* 设置密码弹窗 */
  .password-dialog {
    .current-status {
      font-size: 14px;
      color: var(--td-text-color-secondary);
      margin-bottom: 20px;
    }

    .password-error {
      color: var(--td-error-color);
      font-size: 12px;
      margin-bottom: 8px;
    }

    .password-hint {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
    }
  }

  /* 日志加载 */
  .logs-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
}
</style>
