<script setup lang="ts">
import { useW2Store } from '@/stores/w2';
import {
  W2_INIT_API,
  W2_DATA_API,
  W2_RULE_DEFAULT_API,
  W2_RULE_CUSTOM_API,
  W2_RULES_RELOAD_INTERVAL
} from '@/utils/const';
import { Http } from '../../utils/http';
import { dbPut, dbGet, AUTO_REFRESH_ID } from '../../utils/utools';
import Qrcode from './components/qrcode.vue';
import Steps from './components/steps.vue';

interface Rule {
  index: number;
  selected: boolean;
  name: string;
  data: string;
}

const http = new Http();
const w2Store = useW2Store();

const data = reactive({
  server: {},
  proxyEnabled: false,
  defaultEnabled: false,
  defaultRules: '',
  hasInit: false,
  clientId: '',
  loading: true
});

const autoRefresh = ref<DbDoc>({
  _id: AUTO_REFRESH_ID, // ID
  data: false, // 是否自动更新
  _rev: '' // 带上最新的版本号
});

const w2_rules: Rule[] = reactive([]);

// ------ not reactive -----
let autoReloadTimer = 0;

let mrulesClientId = '';
let mrulesTime = '';

// ============
watch(
  autoRefresh,
  autoR => {
    if (autoR?.data) {
      data.loading = true;
      initWhistle();
    }
  },
  { immediate: true }
);

onBeforeMount(() => {
  try {
    autoRefresh.value = dbGet(AUTO_REFRESH_ID, true, true) || autoRefresh.value;
  } catch (err: any) {
    console.error(`[LOG]: created -> err`, err);
    ant_notification['error']({
      message: `error in created`,
      description: err.message
    });
  }
});

onMounted(async () => {
  initWhistle();
  // check system proxy
  w2Store.proxyWorking = await window.checkSystemProxy({
    address: w2Store.address,
    port: w2Store.port
  });
});

// watch the w2Store
w2Store.$subscribe((mutation, state) => {
  console.log('----w2Store  watch --', mutation, state);
  // @ts-ignore
  if (mutation.payload && mutation.payload.running === undefined) return;
  // @ts-ignore
  if (state.running) {
    initWhistle();
  } else {
    // toggleAutoRefresh(false);
  }
});

// ---!代理系统设置----
async function toggleProxy(enable: boolean) {
  try {
    const isWorking = await window.setSystemProxy(enable);
    w2Store.proxyWorking = enable && isWorking;
    console.log('isProxyWorking', isWorking);
  } catch (err: any) {
    ant_notification['error']({
      message: `${enable ? '设置' : '关闭'}系统代理失败`,
      description: err.message
    });
    throw new Error(err.message);
  }
}

/** ----改变自动更新状态--- */
function toggleAutoRefresh(refresh: boolean) {
  try {
    autoRefresh.value.data = refresh;
    autoRefresh.value = dbPut({ ...autoRefresh.value });
    !refresh && clearTimeout(autoReloadTimer);
    /* ant_notification['success']({
      message: '更新成功'
    }); */
  } catch (err: any) {
    console.error(`[LOG]: autoRefresh -> err`, err);
    ant_notification['error']({
      message: 'error in changeAutoRefresh',
      description: err.message
    });
  }
}

/** 初始化 Whistle 规则配置 */
async function initWhistle() {
  data.loading = true;
  try {
    // if (!w2Store.running) return;
    const res = await http.get(W2_INIT_API);
    if (res.code === 'ERR_NETWORK') {
      w2Store.$patch({
        running: false
      });
      return;
    }

    if (!res.version) {
      throw new Error(res);
    }

    data.loading = false;

    //!WARNING The next two lines of code cannot call the $subscribe callback because Pinia has a issue#992
    w2Store.version = res.server.version;
    w2Store.latestVersion = res.server.latestVersion;

    data.clientId = res.clientId;
    data.defaultEnabled = !res.rules.defaultRulesIsDisabled;
    data.defaultRules = res.rules.defaultRules;
    data.server = res.server;

    // mrulesClientId = res.mrulesClientId;
    // mrulesTime = res.mrulesTime;
    w2_rules.splice(0, w2_rules.length, ...res.rules.list);
    // 刷新规则列表
    autoReloadWhistleRules();
  } catch (err) {
    console.error(`[LOG]: initWhistle -> err`, err);
  }
}

/** 自动更新规则列表 */
async function autoReloadWhistleRules() {
  try {
    if (!w2Store.running) return;
    // if (!autoRefresh.value.data) return;

    const res = await getWhistleRules();
    if (autoRefresh.value.data) {
      clearTimeout(autoReloadTimer);
      autoReloadTimer = setTimeout(
        autoReloadWhistleRules,
        W2_RULES_RELOAD_INTERVAL
      );
    }
  } catch (err) {
    console.log(`[LOG]: autoReloadWhistleRules -> err`, err);
    clearTimeout(autoReloadTimer);
    autoReloadTimer = setTimeout(
      autoReloadWhistleRules,
      W2_RULES_RELOAD_INTERVAL
    );
  }
}

/** 获取规则列表 */
async function getWhistleRules() {
  const res = await http.get(W2_DATA_API, {
    params: {
      clientId: data.clientId,
      startLogTime: -2,
      startSvrLogTime: -2,
      ids: '',
      dumpCount: 0,
      logId: '',
      count: 20,
      _: new Date().getTime()
    }
  });
  data.defaultEnabled = !res.defaultRulesIsDisabled;
  w2_rules.forEach(rule => (rule.selected = res.list.includes(rule.name)));
  return res;
}

/** 应用修改并获取最新的规则 */
async function manuallyModifyRules() {
  const res = await getWhistleRules();
  if (mrulesClientId !== res.mrulesClientId || mrulesTime !== res.mrulesTime) {
    await initWhistle();
  }
}

/** 修改自定义规则状态 */
async function changeRule(item: Rule) {
  try {
    let url = !item.selected
      ? W2_RULE_CUSTOM_API.SELECT
      : W2_RULE_CUSTOM_API.UNSELECT;

    await http.post(url, {
      clientId: data.clientId,
      name: item.name,
      value: item.data,
      selected: item.selected,
      active: true,
      key: `w-reactkey-${item.index + 2}`,
      icon: 'checkbox',
      hide: false,
      changed: false
    });

    await manuallyModifyRules();
  } catch (err: any) {
    console.error(`[LOG]: changeRule -> err`, err);
    ant_notification['error']({
      message: 'error in changeRule',
      description: err.message
    });
  }
}

/** 修改默认规则状态 */
async function changeDefaultRule(value: boolean) {
  try {
    let url = value ? W2_RULE_DEFAULT_API.ENABLE : W2_RULE_DEFAULT_API.DISABLE;
    await http.post(url, {
      clientId: data.clientId,
      name: 'Default',
      fixed: true,
      value: data.defaultRules,
      selected: !value,
      isDefault: true,
      active: true,
      key: 'w-reactkey-1',
      icon: 'checkbox'
    });
    await manuallyModifyRules();
  } catch (err: any) {
    console.error(`[LOG]: changeDefault -> err`, err);
    ant_notification['error']({
      message: 'error in changeDefault',
      description: err.message
    });
  }
}

/** 初始化Rules */
async function setDefaultRules() {
  /* try {
        const blob = new Blob([JSON.stringify(require('./data/rules.json'))], {
          type: 'plain/text'
        })
        const files = new window.File([blob], 'rules.txt', { type: 'plain/text' })
        const form = new FormData()
        form.append('rules', files)
        form.append('replaceAll', 1)
        await http.post(`${this.url}/cgi-bin/rules/import?clientId=${this.clientId}`, form)
      } catch (err) {
        console.error(`[LOG]: setDefaultRules -> err`, err)
        this.$notification['error']({
          message: 'error in setDefaultRules',
          description: err.message
        })
      } */
}
/** 初始化Values */
async function setDefaultValues() {
  /* try {
        const blob = new Blob([JSON.stringify(require('./data/values.json'))], {
          type: 'plain/text'
        })
        const files = new window.File([blob], 'rules.txt', { type: 'plain/text' })
        const form = new FormData()
        form.append('rules', files)
        form.append('replaceAll', 1)
        await http.post(`${this.url}/cgi-bin/values/import?clientId=${this.clientId}`, form)
      } catch (err) {
        console.error(`[LOG]: setDefaultValues -> err`, err)
        this.$notification['error']({
          message: 'error in setDefaultValues',
          description: err.message
        })
      } */
}
</script>

<template>
  <div class="wrapper">
    <Steps />

    <a-row :gutter="16">
      <a-col :span="8">
        <Qrcode />
      </a-col>

      <a-col :span="16">
        <a-card
          :loading="!w2Store.running || data.loading"
          title="规则管理"
          class="list"
        >
          <template #extra>
            <div>
              <sync-outlined
                :spin="!!autoRefresh.data || data.loading"
                @click="initWhistle"
              />
            </div>
          </template>
          <a-list
            class="list"
            size="small"
            item-layout="horizontal"
            :data-source="w2_rules"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <div>Default</div>
                <template #actions>
                  <a-switch
                    checkedChildren="开"
                    unCheckedChildren="关"
                    :checked="data.defaultEnabled"
                    @change="changeDefaultRule"
                  />
                </template>
              </a-list-item>
              <a-list-item>
                <div>{{ item.name }}</div>
                <template #actions>
                  <a-switch
                    checkedChildren="开"
                    unCheckedChildren="关"
                    :checked="item.selected"
                    @change="changeRule(item)"
                  />
                </template>
              </a-list-item>
            </template>
          </a-list>

          <template #actions>
            <div>
              自动刷新
              <a-switch
                checkedChildren="开"
                unCheckedChildren="关"
                :checked="!!autoRefresh.data"
                @change="toggleAutoRefresh"
              />
            </div>
            <div>
              系统代理
              <a-switch
                :disabled="!w2Store.running"
                checkedChildren="开"
                unCheckedChildren="关"
                :checked="w2Store.proxyWorking"
                @change="toggleProxy"
              />
            </div>
          </template>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  .ant-row {
    padding: 10px;
    display: flex;
    justify-content: center;
  }
  // .list {
  //   &__header {
  //     display: flex;
  //     align-items: center;
  //     justify-content: space-between;
  //     flex-direction: row-reverse;
  //     padding-right: 8px;
  //   }
  // }
}
</style>

<style lang="scss">
.ant-steps {
  min-height: 50px;
  &.ant-steps-horizontal:not(.ant-steps-label-vertical)
    .ant-steps-item-description {
    max-width: 100%;
  }

  &-item-container[role='button'] {
    cursor: initial;
  }
}
.card-meta {
  .ant-card-meta-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  &__text {
    white-space: pre-wrap;
    word-break: break-all;
    text-align: center;
  }
}
</style>
