import { defineStore } from 'pinia';
import { UserInfo } from '@/stores/interface';
import piniaPersistConfig from '@/stores/config/persist';

export const useUserStore = defineStore('user_info_store', {
  state: (): UserInfo => ({
    token: '',
    timestamp: 0,
    info: {
      name: '', //账号名称
      displayName: '游客', //显示名称
      roles: [], // 角色
      profilePicture: '' //头像
    }
  }),
  getters: {
    tokenUserInfo: state => state.info
  },
  actions: {
    // Set Token
    setToken(token: string, timestamp?: number) {
      this.token = token;
      this.timestamp = timestamp ? timestamp : Date.now();
    },
    // Set setInfo
    setUserInfo(info: UserInfo['info']) {
      this.info = info;
    },
    async clear() {
      this.token = undefined;
      this.timestamp = undefined;
      this.info = undefined;
    }
  },
  persist: piniaPersistConfig('login_user_info')
});
