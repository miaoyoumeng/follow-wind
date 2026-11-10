import Store from 'electron-store';
import path from 'path';
import { app } from 'electron';

/**
 * 配置文件存储实例（延迟初始化）
 */
let _instant: Store<AppConfig> | null = null;

/**
 * 获取配置存储实例（延迟初始化）
 * 确保在 app.ready 之后调用
 */
const of = (): Store<AppConfig> => {
  if (!_instant) {
    _instant = new Store<AppConfig>({
      name: 'config',
      cwd: path.join(app.getPath('home'), '.silkbook'),
      defaults: {}
    });
  }
  return _instant;
};
/**
 * 配置存储实例的 getter
 */
export const configStore = {
  get: <K extends keyof AppConfig>(key: K) => of().get(key),
  set: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => of().set(key, value),
  has: (key: string) => of().has(key),
  delete: (key: string) => of().delete(key),
  clear: () => of().clear(),
  get store(): AppConfig {
    return of().store;
  }
} as const;

/**
 * 检查并创建配置文件
 * 如果文件不存在会自动创建
 */
export const initConfigFile = (): void => {
  // 通过设置一个值来触发配置文件的创建
  // 如果 gitbook 配置已存在则保持不变，否则设置为默认值
  if (configStore.has('gitbook')) {
    return;
  }
  setGitBookConfig({
    path: '',
    acceptPaths: []
  });
};

/**
 * 获取 gitbook 配置
 */
export const getGitBookConfig = (): AppConfig['gitbook'] | undefined => {
  return configStore.get('gitbook');
};

/**
 * 设置 gitbook 配置
 */
export const setGitBookConfig = (config: AppConfig['gitbook']): void => {
  configStore.set('gitbook', config);
};

/**
 * 获取 Window 配置
 */
export const getWindowConfig = (): AppConfig['window'] | undefined  => {
  return configStore.get('window');
};

/**
 * 设置 gitbook 配置
 */
export const setWindowConfig = (config: AppConfig['window']): void => {
  configStore.set('window', config);
};
