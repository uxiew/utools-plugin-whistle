// Copyright (c) 2022 ChandlerVer5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
// platform specific code
// FROM : https://github.com/alibaba/lightproxy/blob/master/src/main/api.ts

import { exec } from 'child_process';
const SYSTEM_IS_MACOS = window.utools.isMacOs();

type queryProxyParam = { address: string; port: string };

interface ProxyInfo {
  HTTPEnable: string;
  HTTPPort: string;
  HTTPProxy: string;
  HTTPSEnable: string;
  HTTPSPort: string;
  HTTPSProxy: string;
  ProxyAutoConfigEnable: string;
  SOCKSEnable: string;
}

function covertOutputToJSON(output: string) {
  // @ts-ignore
  const content = /{[^]*?}/.exec(
    output.replace(/ExceptionsList.*\n.*\n.*\n/, '')
  )[0];
  const jsonContent = content
    .replace(/([a-zA-Z0-9\.]+)/g, '"$1"')
    .replace(/"\n/g, '",\n')
    .replace(/,.*\n?}/, '}');
  return jsonContent;
}

/**
 * @description 检测是否开启代理
 */
export async function checkSystemProxy(
  params: queryProxyParam
): Promise<boolean> {
  const { address, port } = params;

  return new Promise((resolve, reject) => {
    if (!SYSTEM_IS_MACOS) {
      // Windows
      const WINDOWS_QUERY_PROXY = `reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"`;

      const WINDOWS_PROXY_ENABLE_REGEX = /ProxyEnable\s+REG_DWORD\s+0x1/;
      const currentProxyRegex = new RegExp(
        `ProxyServer\\s+REG_SZ\\s+${address}:${port}`
      );

      exec(WINDOWS_QUERY_PROXY, (error, stdout) => {
        if (error || !stdout.length) {
          reject(error);
        } else if (
          WINDOWS_PROXY_ENABLE_REGEX.test(stdout) &&
          currentProxyRegex.test(stdout)
        ) {
          return resolve(true);
        }
        return resolve(false);
      });
      return;
    }
    exec('scutil --proxy', (error, stdout) => {
      const NO_NETWORK_OUTPUT = `<dictionary> {
}
`;

      function checkProxyInfo(info: ProxyInfo, portStr: string) {
        return (
          info.HTTPEnable === '1' &&
          info.HTTPPort === portStr &&
          info.HTTPProxy === address &&
          info.HTTPSEnable === '1' &&
          info.HTTPSPort === portStr &&
          info.HTTPSProxy === address &&
          info.ProxyAutoConfigEnable === '0' &&
          info.SOCKSEnable === '0'
        );
      }

      try {
        const output = stdout.toString();

        if (output === NO_NETWORK_OUTPUT) {
          // no network, no proxy info
          reject('no network');
        }

        // @ts-ignore
        const jsonContent = covertOutputToJSON(output);

        const info = JSON.parse(jsonContent) as ProxyInfo;
        const portStr = '' + port;

        if (checkProxyInfo(info, portStr)) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (e) {
        if (stdout.toString().length > 0) {
          // has output but can not parse
          resolve(false);
        } else {
          reject(e);
        }
      }
    });
  });
}
