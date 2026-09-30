/* Vite */
declare type Recordable<T = unknown> = Record<string, T>;

declare type RouteMode = 'hash' | 'history';

declare interface ViteEnv {
  VITE_USER_ENV: 'dev' | 'prod' | 'test';
  VITE_GLOB_APP_TITLE: string;
  VITE_GLOB_APP_PREFIX: string;
  VITE_GLOB_APP_ID: number;
  VITE_PORT: number;
  VITE_OPEN: boolean;
  VITE_REPORT: boolean;
  VITE_ROUTER_MODE: RouteMode;
  VITE_BUILD_COMPRESS: 'gzip' | 'brotli' | 'gzip,brotli' | 'none';
  VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE: boolean;
  VITE_DROP_CONSOLE: boolean;
  VITE_PWA: boolean;
  VITE_PUBLIC_PATH: string;
  VITE_API_URL: string;
  VITE_PROXY: [string, string][];
}

interface ImportMetaEnv extends ViteEnv {
  __: unknown;
}

/* 布局方式 */
declare type LayoutType = 'classic' | 'vertical' | 'transverse';

export type AssemblySizeType = 'large' | 'default' | 'small';
/* 语言 */
export type LanguageType = 'zh' | 'en';
