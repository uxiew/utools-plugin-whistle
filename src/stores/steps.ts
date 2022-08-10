// Copyright (c) 2022 ChandlerVer5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export const useStepsStore = defineStore('steps', () => {
  const steps = reactive({
    node: {
      title: `检查node环境`,
      desc: '',
      status: 'process',
      action: '',
      loading: true
    },
    w2: {
      title: `检查Whistle环境`,
      desc: '',
      status: 'wait',
      action: '', // install, reinstall, update, start, stop
      loading: false
    },
    w2_current: {
      title: `检查Whistle运行状态`,
      desc: '',
      status: 'wait',
      action: '',
      loading: false
    }
  });

  function setStep() {
    steps.node.status = 'process';
    steps.node.loading = true;
    steps.w2.status = 'wait';
    steps.w2.loading = false;
    steps.w2_current.status = 'wait';
    steps.w2_current.loading = false;
  }

  return {
    ...toRefs(steps)
  };
});
