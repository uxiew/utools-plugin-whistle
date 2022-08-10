// https://u.tools/docs/developer/preload.html
// 可以在此文件内调用uTools 、nodejs、electron提供的api
// 开发者可以暴露自定义API供后加载脚本使用

import { clipboard, remote, shell } from 'electron'; // 可以使用 remote，应该 utools 的 electorn 版本处于 12 以下吧
// const electronLocalshortcut = require('electron-localshortcut')
import path from 'path';
import fixPath from 'fix-path';
import type { CommandResult } from './command';
import command from './command';
import address from 'address';
import QRCode from 'qrcode';
import { checkSystemProxy } from './proxy';
import { PORT } from '../src/utils/const';

fixPath();

//   getQrCode - 生成二维码
window.getQrCode = async function () {
  const ipAddress = address.ip();
  const currentIpAddress = `${ipAddress}:${PORT}`;
  const ss = `http://${Buffer.from(currentIpAddress)
    .toString('base64')
    .replace(/=+$/, '')}#w2`;

  const qrcode = await QRCode.toDataURL(ss);

  return {
    ip: ipAddress,
    port: PORT,
    address: currentIpAddress,
    ss,
    qrcode
  };
};

window.checkSystemProxy = checkSystemProxy;

window.setSystemProxy = async (enable: boolean) => {
  let result: CommandResult;
  const cmd = enable ? 'w2 proxy' : 'w2 proxy off';

  let success = false; // 代理启用|关闭 成功
  let w2_help_url = 'https://wproxy.org/whistle/proxy.html';
  let errorMsg = `设置系统代理失败。请查看:${w2_help_url}`; // 错误信息

  console.log(
    `[LOG]: setSystemProxy -> set System proxy ${enable ? 'on' : 'off'}`
  );
  result = await command.run(cmd);

  console.log(`[LOG]: setSystemProxy -> set System proxy result`, result);

  success = /success/gi.test(result.data);

  if (!success) {
    throw new Error(
      enable ? errorMsg : `关闭系统代理失败。请查看:${w2_help_url}`
    );
  }
  return success;
};

//@ts-ignore
window.runCmd = async (cmdStr: string) => {
  const result = await command.run(cmdStr);
  return result;
};

// @ts-ignore
window.runLongCmd = async (cmdStr: string) => {
  const p = command.longExec(cmdStr, { stdio: 'pipe', encoding: 'utf8' });

  p.stderr.on('data', data => {
    console.log('Error:', data.toString());
  });

  console.log(`[LOG]: run -> ${p.stdin.writable}`);
  if (p.stdin.writable) p.stdin.write('xee\n');

  p.stdin.on('data', function (data) {
    console.log('stdin--', data, data.toString());
  });

  p.stdout.on('data', function (data) {
    console.log('stdout---', data.toString());
  });
};

//  检查node环境
window.checkNode = async function () {
  console.log(`[LOG]: checkNode -> 开始检查 node`);
  const result = await command.run('node -v && npm -v');
  console.log(`[LOG]: checkNode -> result`, result);

  if (!result.success) {
    throw new Error(
      `检测到未安装node，请安装node后重启应用。下载地址：https://nodejs.org/en/download/`
    );
  }
  return result;
};

// 检查是否有安装Whistle
window.whistleCheck = async function () {
  console.log(`[LOG]: whistleCheck -> 开始检查 whistle`);
  const result = await command.run('w2 -V');
  console.log(`[LOG]: whistleCheck -> result`, result);

  if (!result.success) {
    throw new Error(
      `检测未安装whistle。https://wproxy.org/whistle/install.html`
    );
  }

  return result;
};

// 安装 Whistle --区分 volta | npm 全局安装
window.whistleInstall = async function () {
  console.log(`[LOG]: whistleInstall -> 开始安装 whistle`);
  // const result = await command.run('npm install whistle -g');
  console.log(__dirname);
  let result = await command.run('volta -v');

  if (result.success) {
    console.log(`[LOG]: whistleInstall -> use volta install whistle`, result);
    result = await command.run(
      'volta uninstall whisle && volta install whistle'
    );
  } else {
    console.log(`[LOG]: whistleInstall -> use npm install whistle`);
    result = await command.run('npm install whistle -g');
  }
  if (!result.success) {
    throw new Error(
      `whistle 安装失败。请查看:https://wproxy.org/whistle/install.html`
    );
  }

  return result;
};

/**
 * 操作whistle
 * @param {String} cmd [status|start|stop|restart]
 */
window.whistleControl = async function (cmd: string) {
  console.log(`[LOG]: whistleControl -> w2 ${cmd}`);
  const result = await command.run(`w2 ${cmd}`);
  console.log(`[LOG]: whistleControl -> w2 ${cmd} -> result`, result);

  // if (!result.data.includes('whistle')) {
  //   throw new Error(`检测未安装whistle。https://wproxy.org/whistle/install.html`)
  // }
  if (!result.success) {
    throw new Error(
      `${cmd} 执行失败，请重试。https://wproxy.org/whistle/install.html`
    );
  }

  return result;
};

// #region setClipboard - 设置剪贴板
window.setClipboard = function (text: string) {
  clipboard.writeText(text);
  const res = clipboard.readText();
  console.log(`[LOG]: setClipboard -> res`, res);
  return res;
};
// #endregion

// #region webview - 内嵌web页面
window.webview = function (url: string) {
  try {
    let win = new remote.BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        webSecurity: false,
        preload: path.join(__dirname, 'browser-window.js')
      }
    });

    // 开发打开BrowserWindow控制台
    // win.webContents.openDevTools()
    win.loadURL(url);
  } catch (err) {
    window.utools.ubrowser
      // .devTools('bottom')
      .goto(url)
      .run({ width: 1200, height: 800 });
  }
};
// #endregion
