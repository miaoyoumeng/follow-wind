import path from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv, ConfigEnv, UserConfig } from 'vite';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import { createHtmlPlugin } from 'vite-plugin-html';
import { Recordable, ViteEnv } from '@/typings/global';

function wrapperEnv(envConf: Recordable): ViteEnv {
  const ret: Record<string, string | number | boolean | [string, string][]> = {};
  for (const envName of Object.keys(envConf)) {
    const envValue: string = String(envConf[envName]).replace(/\\n/g, '\n');
    let realName: string | number | boolean = envValue === 'true' ? true : envValue === 'false' ? false : envValue;
    if (envName === 'VITE_PORT') {
      realName = Number(realName);
    }
    if (envName === 'VITE_PROXY') {
      try {
        realName = JSON.parse(String(realName));
      } catch (error) {
        console.log('VITE_PROXY parse error...', error);
      }
    }
    ret[envName] = realName;
  }
  return ret as unknown as ViteEnv;
}

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
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]'
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 8000,
      hmr: {
        overlay: false
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4523/m1/4882174-0-default',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      extensions: ['.json', '.ts', '.vue']
    },
    build: {
      rollupOptions: {
        external: [/^test\//]
      }
    }
  };
});
