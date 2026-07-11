<template>
  <div class="error-container">
    <img src="@/assets/error/404.png" class="error-img" alt="404" />
    <div class="not-detail">
      <h2>400</h2>
      <h4>抱歉，您访问的页面参数不正确~🤷‍♂️🤷‍♀️</h4>
      <t-button type="primary" @click="router.back"> 返回上一页 </t-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './index.scss';
</style>

<script setup lang="ts" name="404">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>
