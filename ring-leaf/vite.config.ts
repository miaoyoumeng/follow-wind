import path from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv, UserConfig, ConfigEnv } from 'vite';

import { createHtmlPlugin } from 'vite-plugin-html';
import { Recordable, ViteEnv } from '@/typings/global';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = wrapperEnv(env);
  const { VITE_GLOB_APP_TITLE } = viteEnv;
  return {
    base: './',
    plugins: [
      vue(),
      createHtmlPlugin({
        minify: true,
        entry: 'src/main.ts',
        inject: {
          data: { title: VITE_GLOB_APP_TITLE }
        }
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import '@/styles/var.scss';`
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 8000,
      hmr: {
        overlay: false
      },
      proxy: {
        '/api': {
          target: 'https://m1.apifoxmock.com/m1/4079066-3716874-default',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      extensions: ['.mjs', '.js', '.json', '.ts', '.d.ts', '.vue']
    },
    build: {
      outDir: 'dist',
      minify: 'esbuild'
    }
  };
});
function wrapperEnv(envConf: Recordable): ViteEnv {
  const ret: any = {};

  for (const envName of Object.keys(envConf)) {
    let realName = envConf[envName].replace(/\\n/g, '\n');
    realName = realName === 'true' ? true : realName === 'false' ? false : realName;
    if (envName === 'VITE_PORT') realName = Number(realName);
    if (envName === 'VITE_PROXY') {
      try {
        realName = JSON.parse(realName);
      } catch (error) {}
    }
    ret[envName] = realName;
  }
  return ret;
}
