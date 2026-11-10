import { defineStore } from 'pinia';
export const useAuthStore = defineStore('skill-book-auth', {
  // 状态定义
  state: () => ({
    count: 0,
    name: 'Pinia Store'
  }),

  // 计算属性
  getters: {
    doubleCount: state => state.count * 2,
    greeting: state => `Hello from ${state.name}`
  },

  // 操作方法
  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
    async fetchData() {
      // 支持异步操作
      const response = await fetch('/api/data');
      const data = await response.json();
      this.name = data.name;
    }
  }
});
