import axios, { AxiosError, type AxiosInstance, type AxiosResponse, type CreateAxiosDefaults } from 'axios';
import router from '@/routers';
import { type ResultData } from './modules';
import { useUserStore } from '@/stores/modules/user';
import { MessagePlugin } from 'tdesign-vue-next';
import { TO_LOGIN_URL } from '@/routers/config.ts';

/**
 * @description：返回状态码
 */
const RESULT_CODE_ENUM = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  ERROR: 500
} as const;

/**
 * @description：常用的 contentTyp 类型
 */
export const CONTENT_TYPE_ENUM = {
  // json
  JSON: 'application/json;charset=UTF-8',
  // text
  TEXT: 'text/plain;charset=UTF-8',
  // form-data 一般配合qs
  FORM_URLENCODED: 'application/x-www-form-urlencoded;charset=UTF-8',
  // form-data 上传
  FORM_DATA: 'multipart/form-data;charset=UTF-8'
};

// 强制退出清空缓存信息
export const clearLoginStores = (): void => {
  // 清除登录标识
  const userStore = useUserStore();
  void userStore.clear();
};

class RequestHttp {
  instance: AxiosInstance;
  constructor(options: CreateAxiosDefaults) {
    this.instance = axios.create(options);
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /** 全局请求拦截 */
  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(
      config => {
        config.headers['Content-Type'] = CONTENT_TYPE_ENUM.JSON;
        const userStore = useUserStore();
        if (userStore?.token) {
          config.headers.Authorization = userStore.token;
        }
        return config;
      },
      error => {
        const message = error instanceof Error ? error.message : String(error);
        this.showErrorMessage(message);
        return Promise.reject(error instanceof Error ? error : new Error(message));
      }
    );
  }

  /** 全局响应拦截 */
  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      res => {
        const data = res.data as ResultData<unknown>;
        const code = data.code;

        // 添加promise主要是为了刷新token的时候拦截resolve
        return new Promise((resolve, reject) => {
          if (code === RESULT_CODE_ENUM.SUCCESS) {
            // 成功的操作
            resolve(data as unknown as AxiosResponse);
          } else if (code >= 1000 && code <= 2000) {
            // 成功的操作
            this.showWarningMessage(data.msg);
            resolve(data as unknown as AxiosResponse);
          } else if (code === RESULT_CODE_ENUM.UNAUTHORIZED) {
            clearLoginStores();
            void router.push({ path: TO_LOGIN_URL });
          } else if (code === RESULT_CODE_ENUM.FORBIDDEN) {
            this.showWarningMessage('权限访问拒绝');
          } else {
            // 错误处理
            this.showErrorMessage(data.msg);
            reject(new Error(data.msg ?? 'Error'));
          }
        });
      },
      error => {
        if (error instanceof AxiosError) {
          const axiosError = error as AxiosError;
          console.log(axiosError.message);
          this.showErrorMessage('请求失败，请稍等！');
        } else {
          this.showErrorMessage('请求失败，请稍后重试！');
        }
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  }

  get<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.instance.get(url, { ...params, ..._object });
  }

  post<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.instance.post(url, { ...params, ..._object });
  }

  put<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.instance.put(url, { ...params, ..._object });
  }

  delete<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.instance.delete(url, { ...params, ..._object });
  }

  download(url: string, params?: object, _object = {}): Promise<BlobPart> {
    return this.instance.post(url, params, { ..._object, responseType: 'blob' });
  }

  /**
   * @description: 错误信息弹窗
   * @param {*} message 错误消息
   * @param {*} type 类型
   */
  showWarningMessage(message = 'Warning'): void {
    console.log('warning message:' + message);
    void MessagePlugin.warning(message, 2000);
  }

  /**
   * @description: 错误信息弹窗
   * @param {*} message 错误消息
   * @param {*} type 类型
   */
  showErrorMessage(message = 'Error'): void {
    console.log('error message:' + message);
    void MessagePlugin.error(message, 2000);
  }
}

export default RequestHttp;
