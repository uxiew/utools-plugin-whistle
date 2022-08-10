// Copyright (c) 2022 ChandlerVer5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// ======= whistle API ======

export const ADDRESS: string = import.meta.env.VITE_W2_ADDRESS;
export const PORT: string = import.meta.env.VITE_W2_PORT;

export const W2_URL: string = `http://${ADDRESS + ':' + PORT}`;

export const W2_INIT_API = `${W2_URL}/cgi-bin/init?_=${new Date().getTime()}`;
export const W2_DATA_API = `${W2_URL}/cgi-bin/get-data`;

// ==== rules =====
export const W2_RULE_DEFAULT_API = {
  ENABLE: `${W2_URL}/cgi-bin/rules/enable-default`,
  DISABLE: `${W2_URL}/cgi-bin/rules/disable-default`
};

export const W2_RULE_CUSTOM_API = {
  SELECT: `${W2_URL}/cgi-bin/rules/select`,
  UNSELECT: `${W2_URL}/cgi-bin/rules/unselect`
};

//   --===== const =====
export const W2_RULES_RELOAD_INTERVAL = 500;
