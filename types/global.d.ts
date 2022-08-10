// Copyright (c) 2022 ChandlerVer5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
//

declare const window: Window & typeof globalThis & UToolsApi;

interface Window {
  pluginFileName: string;
  pluginPath: string;

  run: () => Promise<any>;

  checkSystemProxy: (param: {
    port: string;
    address: string;
  }) => Promise<boolean>;
  setSystemProxy: (enable: boolean) => Promise<boolean>;

  getQrCode: () => any;
  checkNode: () => any;

  setClipboard: (text: string) => any;
  webview: (url: string) => any;

  whistleCheck: () => any;
  whistleInstall: () => any;
  whistleControl: (cmd: string) => any;
}
