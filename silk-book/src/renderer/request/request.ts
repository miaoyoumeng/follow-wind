import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults } from 'axios';
import { MessagePlugin } from 'tdesign-vue-next';

import router from '@/renderer/routers';
import { ResultData } from './modules';
import { useTokenStore } from '@/renderer/stores/modules/user';
import { VITE_HOME_INDEX_URI } from '@/renderer/routers/config.ts';

class RequestHttp {
  instance: AxiosInstance;
  constructor(options: CreateAxiosDefaults) {
    this.instance = axios.create(options);
    // 全局的请求请求拦截
    this.instance.interceptors.request.use(
      config => {
        config.headers['Content-Type'] = ContentTypeEnum.JSON;
        const tokenStore = useTokenStore();
        if (tokenStore && tokenStore.token) {
          config.headers.Authorization = tokenStore.token;
        }
        return config;
      },
      error => {
        this.showErrorMessage(error);
        return Promise.reject(new Error(error || 'Error'));
      }
    );
    // 全局的响应拦截
    this.instance.interceptors.response.use(
      res => {
        const data = res.data;
        const code = data.code;

        // 添加promise主要是为了刷新token的时候拦截resolve
        return new Promise((resolve, reject) => {
          if (code === ResultCodeEnum.SUCCESS) {
            // 成功的操作
            resolve(data);
          } else if (code >= 1000 && code <= 2000) {
            // 成功的操作
            this.showWarningMessage(data.displayMsg ? data.displayMsg : data.msg);
            // resolve(data);
          } else if (code === ResultCodeEnum.UNAUTHORIZED) {
            clearTokenStores();
            router.push({ path: VITE_HOME_INDEX_URI });
          } else if (code === ResultCodeEnum.FORBIDDEN) {
            this.showWarningMessage('权限访问拒绝');
          } else {
            // 错误处理
            this.showErrorMessage(data.displayMsg ? data.displayMsg : data.msg);
            reject(new Error(data.msg || 'Error'));
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
        return Promise.reject(new Error(error || 'Error'));
      }
    );
  }

  get<T>(url: string, params?: object): Promise<ResultData<T>> {
    return this.instance.get(url, { params, headers: { 'Content-Type': ContentTypeEnum.JSON } });
  }

  delete<T>(url: string, params?: object): Promise<ResultData<T>> {
    return this.instance.delete(url, { params, headers: { 'Content-Type': ContentTypeEnum.JSON } });
  }

  post<T>(url: string, data?: object, params?: object): Promise<ResultData<T>> {
    return this.instance.post(url, data, { params, headers: { 'Content-Type': ContentTypeEnum.JSON } });
  }
  /** 上传 */
  upload<T>(url: string, data?: object, params?: object): Promise<ResultData<T>> {
    return this.instance.post(url, data, { params, headers: { 'Content-Type': ContentTypeEnum.FORM_DATA } });
  }

  put<T>(url: string, data?: object, params?: object): Promise<ResultData<T>> {
    return this.instance.put(url, data, { params, headers: { 'Content-Type': ContentTypeEnum.JSON } });
  }
  /** 下载 */
  download(url: string, params?: object, _object = {}): Promise<BlobPart> {
    return this.instance.post(url, params, { ..._object, responseType: 'blob' });
  }

  /**
   * @description: 错误信息弹窗
   * @param {*} message 错误消息
   */
  showWarningMessage(message: string = 'Warning') {
    console.log('warning message:' + message);
    MessagePlugin.warning(message, 2000);
  }

  /**
   * @description: 错误信息弹窗
   * @param {*} message 错误消息
   * @param {*} type 类型
   */
  showErrorMessage(message = 'Error') {
    console.log('error message:' + message);
    MessagePlugin.error(message, 2000);
  }
}
// 强制退出清空缓存信息
const clearTokenStores = () => {
  // 清除登录标识
  const tokenStore = useTokenStore();
  tokenStore.clear();
};
/**
 * @description：返回状态码
 */
enum ResultCodeEnum {
  SUCCESS = 200,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  ERROR = 500
}

/**
 * @description：常用的 contentTyp 类型
 */
export enum ContentTypeEnum {
  // json
  JSON = 'application/json;charset=UTF-8',
  // text
  TEXT = 'text/plain;charset=UTF-8',
  // form-data 一般配合qs
  FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8',
  // form-data 上传
  FORM_DATA = 'multipart/form-data;charset=UTF-8'
}
export default RequestHttp;
