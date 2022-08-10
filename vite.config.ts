import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import AutoImport from 'unplugin-auto-import/vite';
import type { Resolver } from 'unplugin-auto-import/types';

const importStyle = name => `ant-design-vue/es/${name}/style/css`;

const antDesignVueImport: Resolver = name => {
  const isAntDesignVueApi = name.startsWith('ant_');
  const api_name = name.slice('ant_'.length);

  // console.log('name====', name, isAntDesignVueApi);
  return isAntDesignVueApi
    ? {
        name: api_name,
        from: `ant-design-vue/es`,
        sideEffects: importStyle(api_name)
      }
    : null;
};

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'types/auto-imports.d.ts',
      resolvers: [antDesignVueImport]
    }),
    Components({
      dts: 'types/components.d.ts',
      resolvers: [AntDesignVueResolver({ resolveIcons: true })]
    })
  ]
});
