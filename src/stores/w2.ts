// Copyright (c) 2022 ChandlerVer5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ADDRESS, PORT } from '@/utils/const';

interface WhistleData {
  running?: boolean;
  latestVersion?: string; // 最新版本
  version?: string; // 当前版本
  proxyWorking?: boolean;
  address: string;
  port: string;
}

export const useW2Store = defineStore('w2', () => {
  const w2: WhistleData = reactive({
    running: false,
    latestVersion: '',
    version: '',
    proxyWorking: false,
    address: ADDRESS,
    port: PORT
  });

  function setW2(w2Data: WhistleData) {
    for (const key in w2Data) {
      // @ts-ignore
      w2[key] = w2Data[key];
    }
  }

  return {
    ...toRefs(w2),
    setW2
  };
});
