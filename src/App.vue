<script setup lang="ts">
import { W2_URL } from './utils/const';
import { open } from './utils/utools';

const router = useRouter();
onBeforeMount(() => {
  window.utools.onPluginEnter(async ({ code, type, payload }) => {
    console.log('---用户进入插件--->', { code, type, payload });
    switch (code) {
      case 'network':
        open(W2_URL + '/#network');
        window.utools.outPlugin();
        break;
      default:
        router.push({ path: `/${code}` });
        break;
    }
  });
});
</script>

<template>
  <!-- vue3.0 配置 -->
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style lang="scss">
// @import './assets/styles.scss';
</style>
