<template>
  <div class="error-container">
    <img src="@/assets/error/500.png" class="not-img" alt="500" />
    <div class="not-detail">
      <h2>500</h2>
      <h4>抱歉，您的网络不见了~🤦‍♂️🤦‍♀️</h4>
      <t-button type="primary" @click="router.back"> 返回上一页 </t-button>
    </div>
  </div>
</template>

<script setup lang="ts" name="500">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<style scoped lang="scss">
@import './index.scss';
</style>
