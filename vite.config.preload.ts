// Copyright (c) 2022 ChandlerVer5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const PACKAGE_ROOT = __dirname;

export default ({ mode }) => {
  // process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  // console.log('import.meta', process.env);

  return defineConfig({
    root: PACKAGE_ROOT,
    ssr: {
      noExternal: ['fix-path', 'address', 'qrcode']
    },
    build: {
      emptyOutDir: false,
      ssr: true,
      target: `esnext`,
      minify: false, // process.env.MODE !== 'development',
      lib: {
        entry: 'preload/index.ts',
        formats: ['cjs']
      },
      rollupOptions: {
        output: {
          entryFileNames: 'preload.js' // '[name].cjs'
        }
      },
      reportCompressedSize: false
    }
  });
};
