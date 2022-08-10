// Copyright (c) 2022 ChandlerVer5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { createWebHashHistory, createRouter } from 'vue-router';

export const routes = [
  {
    path: '/',
    redirect: '/rules'
  },
  {
    path: '/network',
    redirect: '/rules'
  },
  {
    path: '/rules',
    name: 'rules',
    meta: {
      title: 'rules'
    },
    component: () =>
      import(/* webpackChunkName: "rules" */ '../views/rules/index.vue')
  }
];

export default createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: createWebHashHistory(),
  routes // short for `routes: routes`
});
