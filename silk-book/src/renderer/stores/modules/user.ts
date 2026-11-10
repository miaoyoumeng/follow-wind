import { defineStore } from 'pinia';
import { UserInfo } from '@/renderer/stores/interface';
import piniaPersistConfig from '@/renderer/stores/config/persist.ts';

export const useTokenStore = defineStore('token_info_store', {
  state: (): UserInfo => ({
    token: '',
    timestamp: 0,
    info: {
      name: '', //账号名称
      displayName: '游客', //显示名称
      roles: [], // 角色
      avatar: '' //头像
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
  persist: piniaPersistConfig('token_info')
});
