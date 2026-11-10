/* Vite */
declare type Recordable<T = {}> = Record<string, T>;

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
  VITE_HOME_INDEX_URI: string; // 首页
  VITE_LOGIN_URI: string; // 登录地址
}

interface ImportMetaEnv extends ViteEnv {
  __: unknown;
}

/* __APP_INFO__ */
declare const __APP_INFO__: {
  pkg: {
    name: string;
    version: string;
    dependencies: Recordable<string>;
    devDependencies: Recordable<string>;
  };
  lastBuildTime: string;
};
/* 布局方式 */
declare type LayoutType = 'classic' | 'vertical' | 'transverse';

export type AssemblySizeType = 'large' | 'default' | 'small';
/* 语言 */
export type LanguageType = 'zh' | 'en';

/**
 * gitbook 导航树节点接口
 */
export interface NavItem {
  /** 菜单项标题 */
  title: string;
  /** 文件路径（如果有链接） */
  path?: string;
  /** 子菜单项 */
  children?: NavItem[];
  /** 层级深度 */
  level: number;
}

declare global {
  /**
   * 应用配置项
   */
  interface AppConfig {
    gitbook?: GitBookConfig;
    window?: Rectangle;
    [key: string]: unknown;
  }

  /**
   * GitBook 目录配置项
   */
  export interface GitBookConfig {
    path: string;
    //其他的 gitbook 地址
    acceptPaths?: string[];
  }

  interface Window {
    electronStore: {
      get: <K extends keyof AppConfig>(key: K) => Promise<AppConfig[K]>;
      set: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<boolean>;
    };
    electronApi: {
      renderGitBookTree: () => Promise<MdNavNode[]>;
      renderMarkdown: (markdownPath: string) => Promise<string>;
      renderImage: (imagePath: string, current: string) => Promise<string>;
    };
  }
}
