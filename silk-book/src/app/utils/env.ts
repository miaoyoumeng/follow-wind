type Env = {
  // 是否是开发环境
  isDev: boolean;

  // 是否是生产环境
  isProd: boolean;
};

export const env: Env = {
  isDev: process.env.npm_lifecycle_event === 'app-all',
  isProd: process.env.npm_lifecycle_event === 'production'
};
