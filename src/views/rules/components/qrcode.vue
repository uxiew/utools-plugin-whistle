<script setup lang="ts">
import { W2_URL } from "@/utils/const";
import { open } from "@/utils/utools";
import { useW2Store } from "@/stores/w2";
const w2Store = useW2Store();

// maybe need raective,placeholder
const data = reactive({
  ip: "",
  port: "",
  address: "",
  ss: "",
  qrcode: "",
});

onBeforeMount(() => {
  try {
    getQrCode();
  } catch (err: any) {
    console.error(`[LOG]: WhistleQrcode -> created -> err`, err);
    ant_notification["error"]({
      message: `error in qrcode created`,
      description: err.message,
    });
  }
});

async function getQrCode() {
  try {
    const { ip, port, address, ss, qrcode } = await window.getQrCode();
    data.ip = ip;
    data.port = port;
    data.address = address;
    data.ss = ss;
    data.qrcode = qrcode;
  } catch (err) {
    console.error(`[LOG]: getQrCode -> err`, err);
  }
}

function setClipboard(text: string) {
  try {
    window.setClipboard(text);
    ant_message.success(`复制成功:${text}`);
  } catch (err) {
    console.log(`[LOG]: setClipboard -> err`, err);
  }
}

function openW2() {
  if (w2Store.running) {
    open(W2_URL + "#network");
  } else {
    ant_message.error(`whistle 服务未启动!`);
  }
}

const { ip, port, address, ss, qrcode } = toRefs(data);
</script>

<template>
  <a-card hoverable>
    <template #cover>
      <img class="qrcode" :src="qrcode" :alt="ss" />
    </template>

    <a-card-meta class="card-meta">
      <template #title>
        <a-tooltip title="点击复制IP" placement="right">
          <div class="card-meta__text" @click="setClipboard(address)">
            {{ address }}
          </div>
        </a-tooltip>
      </template>
      <template #description>
        <a-tooltip title="点击复制SS地址" placement="right">
          <div class="card-meta__text" @click="setClipboard(ss)">{{ ss }}</div>
        </a-tooltip>
      </template>
    </a-card-meta>

    <template #actions class="ant-card-actions">
      <!-- <router-link to="/whistle"
        ><ie-outlined />&nbsp;查看Whistle控制台</router-link
      > -->
      <div @click="openW2">
        <ie-outlined />
        &nbsp;查看Whistle控制台
      </div>
    </template>
  </a-card>
</template>

<style scoped lang="scss">
.qrcode {
  width: 98%;
  margin: 2px auto -14px;
}
</style>
