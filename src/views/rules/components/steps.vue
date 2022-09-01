<!--
 Copyright (c) 2022 ChandlerVer5
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->
<template>
  <a-row>
    <a-col :span="24">
      <a-steps size="small">
        <!-- check node step -->
        <a-step :title="setpsStore.node.title" :status="setpsStore.node.status">
          <template v-if="setpsStore.node.loading" #icon>
            <loading-outlined />
          </template>

          <template #description>
            <div>{{ setpsStore.node.desc }}</div>
          </template>
        </a-step>

        <!-- whistle-->
        <a-step :title="setpsStore.w2.title" :status="setpsStore.w2.status">
          <template v-if="setpsStore.w2.loading" #icon>
            <loading-outlined />
          </template>
          <template #description>
            <div>
              {{ setpsStore.w2.desc }}
              <a-button
                v-if="setpsStore.w2.action === 'renew'"
                size="small"
                type="primary"
                @click="w2BtnRenew"
              >
                {{ w2BtnRenewTxt }}
              </a-button>
              <a-button
                v-if="setpsStore.w2.action === 'install'"
                size="small"
                type="primary"
                @click="w2BtnInstall"
              >
                立即安装
              </a-button>
            </div>
          </template>
        </a-step>

        <!-- step to check if whistle is running-->
        <a-step
          :title="setpsStore.w2_current.title"
          :status="setpsStore.w2_current.status"
        >
          <template v-if="setpsStore.w2_current.loading" #icon>
            <loading-outlined />
          </template>

          <template #description>
            <div>
              {{ setpsStore.w2_current.desc }}
              <a-button
                v-if="setpsStore.w2_current.action === 'start'"
                size="small"
                type="primary"
                @click="() => checkWhistleStatus('start')"
              >
                启动
              </a-button>

              <template v-if="setpsStore.w2_current.action === 'restart+stop'">
                <a-button
                  size="small"
                  type="primary"
                  @click="() => checkWhistleStatus('restart')"
                >
                  重启
                </a-button>
                <a-button
                  style="margin-left: 10px"
                  size="small"
                  type="danger"
                  @click="() => checkWhistleStatus('stop')"
                >
                  停止
                </a-button>
              </template>
            </div>
          </template>
        </a-step>
      </a-steps>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { useStepsStore } from "@/stores/steps";
import { useW2Store } from "@/stores/w2";

const setpsStore = useStepsStore();
const w2Store = useW2Store();

let w2_pre_running;

const w2BtnRenewTxt = computed(() =>
  w2Store.version !== w2Store?.latestVersion
    ? `升级 ${w2Store.version} -> ${w2Store.latestVersion}`
    : `重新安装 ${w2Store.version}`,
);

onMounted(() => {
  init();
});
onBeforeUnmount(() => {
  w2Store.$patch({ running: false });
});

async function init() {
  try {
    await checkNode();
    await checkWhistle();
    await checkWhistleStatus();
  } catch (err: any) {
    console.log(`[LOG]: init -> err`, err);
    w2Store.$patch({ running: false });
  }
}

/** 检查本地是否安装Node */
async function checkNode() {
  try {
    setpsStore.node.status = "process";
    setpsStore.node.loading = true;
    setpsStore.node.desc = "";
    await window.checkNode();
    setpsStore.node.status = "finish";
  } catch (err: any) {
    setpsStore.node.desc = err.message;
    setpsStore.node.status = "error";
    throw new Error(err.message);
  } finally {
    setpsStore.node.loading = false;
  }
}

/** 检查本地是否安装 Whistle */
async function checkWhistle() {
  try {
    setpsStore.w2.status = "process";
    setpsStore.w2.loading = true;
    setpsStore.w2.desc = "";
    await window.whistleCheck();
    setpsStore.w2.status = "finish";
  } catch (err: any) {
    setpsStore.w2.action = "install";
    setpsStore.w2.status = "error";
    throw new Error(err.message);
  } finally {
    setpsStore.w2.loading = false;
  }
}

// 按钮 安装 Whistle
async function w2BtnInstall() {
  await installWhistle();
  await checkWhistleStatus();
}

/**
 * @description 检查Whistle状态，执行命令
 * @param {string} cmd 命令字符
 */
async function checkWhistleStatus(cmd = "status") {
  try {
    setpsStore.w2_current.status = "process";
    setpsStore.w2_current.loading = true;
    setpsStore.w2_current.desc = "";
    const { data } = await window.whistleControl(cmd);
    if (/(No running)|(killed)/gi.test(data)) {
      setpsStore.w2_current.status = "error";
      setpsStore.w2_current.desc = data;
      setpsStore.w2_current.action = "start";
      w2Store.$patch({ running: false });
    } else if (/(is running)|(local\.whistlejs\.com)/gi.test(data)) {
      setpsStore.w2_current.status = "finish";
      setpsStore.w2_current.action = "restart+stop";
      w2Store.$patch({ running: true });
    }
  } catch (err: any) {
    setpsStore.w2_current.desc = err.message;
    setpsStore.w2_current.status = "error";
    throw new Error(err.message);
  }

  setpsStore.w2_current.loading = false;
  setTimeout(() => {
    setpsStore.w2.action = "renew";
  }, 800);
}

/** 安装 Whistle */
async function installWhistle() {
  try {
    setpsStore.w2.status = "process";
    setpsStore.w2.loading = true;
    setpsStore.w2.desc = "";
    await window.whistleInstall();
    await window.whistleCheck();
    setpsStore.w2.status = "finish";
  } catch (err: any) {
    setpsStore.w2.desc = err.message;
    setpsStore.w2.status = "error";
    throw new Error(err.message);
  } finally {
    setpsStore.w2.loading = false;
  }
}

/** 重新安装/升级Whistle */
async function w2BtnRenew() {
  setpsStore.w2.loading = true;
  w2_pre_running = w2Store.running;
  w2Store.running = false;
  await installWhistle();
  w2_pre_running && (await checkWhistleStatus("restart"));
}
</script>

<style scoped></style>
