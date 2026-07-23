import http from '@/request';
import { ResultData } from '@/request/modules.ts';
import { useUserStore } from '@/stores/modules/user.ts';
import router from '@/routers/index';
import { MAIN_URL, TO_LOGIN_URL } from '@/routers/config.ts';
import md5 from 'md5';
import { useAuthStore } from '@/stores/modules/auth.ts';

// 登录模块
export namespace Login {
  export interface ReqLoginForm {
    uid: string;
    password: string;
  }
  export interface RespLogin {
    token: string;
    timestamp: number;
  }
  export interface RespUserInfo {
    name: string; //账号名称
    displayName: string; //显示名称
    roles: number[]; //角色
    profilePicture: string; //头像
  }
}

// 用户退出登录
const logoutApi = () => {
  return http.get('/sso/logout');
};

/**
 * @name 用户登录
 */
const loginApi = (params: Login.ReqLoginForm): Promise<ResultData<Login.RespLogin>> => {
  return http.post('/sso/security/login', params);
};

/**
 * @name 用户信息
 */
const tokenUserInfoApi = (): Promise<ResultData<Login.RespUserInfo>> => {
  return http.get('/sso/token/user/info');
};

////////////////////////////////////api function above ////////////////////////////////////

/**
 * 退出登录
 */
export const logout = async () => {
  await logoutApi();
  const userStore = useUserStore();
  const authStore = useAuthStore();
  await userStore.clear();
  await authStore.clear();
  await router.push(TO_LOGIN_URL);
};

/* 登录表单提交 */
export const formLogin = async (formData: Login.ReqLoginForm) => {
  const { data } = await loginApi({ ...formData, password: md5(formData.password) });
  const userStore = useUserStore();
  if (data && data.token) {
    userStore.setToken(data.token, data.timestamp);
    tokenUserInfoApi().then(resp => {
      if (resp && resp.data) {
        const info = {
          name: resp.data.name, //账号名称
          displayName: resp.data.displayName ? resp.data.displayName : '游客', //显示名称
          roles: resp.data.roles, // 角色
          profilePicture: resp.data.profilePicture //头像
        };
        userStore.setUserInfo(info);
        // 主页
        router.push(MAIN_URL);
      }
    });
  }
};
